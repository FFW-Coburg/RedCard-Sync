# BOS-ID API Client Documentation

> Legacy Vuex store modules that served as the API client layer for the BOS-ID backend.
> These modules were removed from the codebase — this document preserves the API contract and known issues for reference.
> All modules were namespaced and registered through `index.js`.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication & Session Management](#authentication--session-management)
- [Permission Model](#permission-model)
- [Module: auth](#module-auth)
- [Module: bonus](#module-bonus)
- [Module: changeRequest](#module-changerequest)
- [Module: core](#module-core)
- [Module: customer](#module-customer)
- [Module: customizing](#module-customizing)
- [Module: field](#module-field)
- [Module: idCard](#module-idcard)
- [Module: person](#module-person)
- [Module: user](#module-user)
- [Module: index (Registry)](#module-index-registry)
- [Missing Modules](#missing-modules)
- [Known Bugs & Issues](#known-bugs--issues)
- [Complete API Endpoint Summary](#complete-api-endpoint-summary)

---

## Architecture Overview

Each file exported a **namespaced Vuex module** with `state`, `getters`, `mutations`, and `actions`. API calls were made via `Vue.prototype.axios`. Every authenticated action obtained headers by dispatching `auth/getHeaders` (cross-module, `{ root: true }`), which conditionally attached a `Bearer` token.

Base URL prefix for all endpoints: **`/api/v1`**

---

## Authentication & Session Management

Implemented in `auth.js`.

### Token lifecycle

1. **Login** (`POST /api/v1/accounts/login`) — returns a user object containing `token`. Stored in `state.user`.
2. **Session window** — 5 minutes (`sessionTime = 60 * 5` seconds) from `loginTime`. `isAuthenticated` compares current epoch seconds against `loginTime + 300`.
3. **Token refresh** (`POST /api/v1/accounts/token/refresh`) — sends current token and `validityMinutes: 60`. Response replaces user object and resets `loginTime`.
4. **Logout** (`POST /api/v1/accounts/logout`) — clears state and redirects to `Login` route.

### Header construction

| Action | Headers |
|---|---|
| `getHeaders` (authenticated) | `X-Requested-With: XMLHttpRequest`, `Authorization: Bearer <token>` |
| `getHeaders` (unauthenticated) | `X-Requested-With: XMLHttpRequest` |
| `getHeadersUpload` (authenticated) | Same as above plus `content-type: application/octet-stream` |

---

## Permission Model

Checked client-side in `auth.js` actions:

### `hasAdminPermission()`
Returns `true` if `state.user.is_customer_admin` is truthy.

### `hasUserPermission(department)`
- If `is_customer_admin` is true, returns `true` for all departments.
- Otherwise, iterates `state.user.organisation_mappings` and checks per-mapping flags:

| Department string | Required mapping flag |
|---|---|
| `"Organizations"` | `organisation_permission` |
| `"Users"` | `account_permission` |
| `"IdCard"` | `id_card_permission` |
| `"Amendments"` | `id_card_permission` |
| `"UnapprovedIDCards"` | `id_card_permission` |
| `"ExpiredIDCards"` | `id_card_permission` |

---

## Module: auth

### State

| Field | Type | Default |
|---|---|---|
| `loginTime` | `Number` | `0` |
| `user` | `Object` | `{}` |

### Getters

| Getter | Returns |
|---|---|
| `getUser` | `state.user` |
| `getAccessToken` | `state.user.token` |

### API Endpoints

#### `POST /api/v1/accounts/login`

**Action:** `createLogin(account)`

**Request body:**
```json
{ "email": "<string>", "password": "<string>" }
```

**Response:** User object (stored in state). Returns HTTP status code.

#### `PUT /api/v1/accounts/password`

**Action:** `changePassword(data)`

**Request body:**
```json
{ "email": "<string>", "password": "<new_password>" }
```

**Side effect:** Triggers `makeLogout` on success.

#### `POST /api/v1/accounts/token/refresh`

**Action:** `refreshToken()`

**Request body:**
```json
{ "token": "<current_token>", "validityMinutes": 60 }
```

**Response:** Updated user object with new token.

#### `POST /api/v1/accounts/logout`

**Action:** `makeLogout()`

**Side effect:** Clears user state, resets loginTime, redirects to Login route.

#### `PUT /api/v1/accounts/resetPassword`

**Action:** `resetPassword(email)`

**Request body:**
```json
{ "email": "<string>" }
```

**Note:** Only action that does NOT attach auth headers. Redirects to Login route on success.

---

## Module: bonus

### State

| Field | Type | Default |
|---|---|---|
| `bonuses` | `Array` | `[]` |
| `bonus` | `Object` | `{}` |

### API Endpoints

#### `GET /api/v1/bonuses`

**Action:** `loadBonuses()`

**Response:** Array of bonus objects. Each enriched client-side with:
- `image_url` — constructed from `image_id`
- `address` — normalized to object form
- `categories` — ensured as array
- `previewImage` — base64 image loaded via `core/getImage64`, falls back to `/icons/Photo.svg`
- `organisations` — loaded via `loadBonusOrganisations`, mapped to array of `organisation_id`

#### `GET /api/v1/bonuses/{id}`

**Action:** `loadBonus(id)`

#### `POST /api/v1/bonuses`

**Action:** `createBonus(bonus)`

**Request body:**
```json
{
  "status": "<string>",
  "categories": ["<string>"],
  "code": "<string>",
  "global": false,
  "start_at": "<datetime>",
  "end_at": "<datetime>",
  "headline_text": "<string>",
  "description_text": "<string>",
  "discount_text": "<string>",
  "email": "<string>",
  "phone_number": "<string>",
  "website_url": "<string>",
  "shop_url": "<string>",
  "image_id": "<string|null>",
  "address": { "country": "", "state": "", "city": "", "zip_code": "", "street_address": "", "additional": "", "name": "" },
  "customer_id": "<from auth user>"
}
```

#### `PUT /api/v1/bonuses/{id}`

**Action:** `updateBonus(bonus)`

#### `DELETE /api/v1/bonuses/{id}`

**Action:** `deleteBonus(id)`

#### `PUT /api/v1/bonuses/{bonusId}/organisations`

**Action:** `addOrganisationToBonus({ bonusId, organisationId })`

#### `GET /api/v1/bonuses/{bonusId}/organisations`

**Action:** `loadBonusOrganisations(bonusId)`

#### `GET /api/v1/bonuses/{bonusId}/organisations/{organisationId}`

**Action:** `getBonusOrganisation({ bonusId, organisationId })`

#### `DELETE /api/v1/bonuses/{bonusId}/organisations/{organisationId}`

**Action:** `removeOrganisationFromBonus({ bonusId, organisationId })`

---

## Module: changeRequest

### State

| Field | Type | Default |
|---|---|---|
| `changeRequests` | `Array` | `[]` |

### API Endpoints

#### `GET /api/v1/change-requests`

**Action:** `loadChangeRequests(params={ status: 'open' })`

**Query parameters:** Defaults to `{ status: 'open' }`. See bugs section for duplicate `params` key issue.

#### `PUT /api/v1/change-requests/{id}/review?accept={value}`

**Action:** `reviewAmendment({ id, value })`

**Side effect:** Reloads change requests on success.

---

## Module: core

### State

| Field | Type | Default |
|---|---|---|
| `image` | `null` | `null` |
| `dashboardStats` | `Object` | `{ openChangeRequests: 0, openIdCards: 0, expiredIdCards: 0 }` |

### API Endpoints

#### `GET /api/v1/images/{id}`

**Action:** `loadImage(id)` / `getImage64(id)`

`getImage64` returns `resp.data.encoded_image_data` (base64 string).

#### `POST /api/v1/images`

**Action:** `createImage(base64EncodedString)`

**Request body:**
```json
{ "encoded_image_data": "<base64 string>" }
```

#### `DELETE /api/v1/images/{id}`

**Action:** `deleteImage(id)`

#### `GET /api/v1/dashboard/stats`

**Action:** `loadDashboardStats()`

**Response mapped to state as:**
```json
{ "openChangeRequests": "<number>", "openIdCards": "<number>", "expiredIdCards": "<number>" }
```

---

## Module: customer

### State

| Field | Type | Default |
|---|---|---|
| `customer` | `Object` | `{}` |
| `customerConfiguration` | `Object` | `{}` |

### API Endpoints

#### `GET /api/v1/customers/{customerId}`

**Action:** `loadCustomer(customerId)`

**Note:** If `invoice_address` is null, a default empty address object is injected.

#### `PUT /api/v1/customers/{id}`

**Action:** `updateCustomer(customer)`

#### `GET /api/v1/customers/{customerId}/configuration`

**Action:** `loadCustomerConfiguration(customerId)`

#### `PUT /api/v1/customers/{customer_id}/configuration`

**Action:** `updateCustomerConfiguration(customerConfiguration)`

**Request body:**
```json
{ "expiry_warning_days": "<number>", "id_card_validity": "<value>" }
```

#### `PUT /api/v1/customers/{id}/dpp`

**Action:** `updateDataAgreement(customer)`

**Note:** `dpp_text` was hardcoded to the literal string `"string"` — likely a placeholder bug.

#### `DELETE /api/v1/customers/{customerId}/dpp`

**Action:** `deleteCustomerDpp(customerId)`

---

## Module: customizing

### State

| Field | Type | Default |
|---|---|---|
| `customizingFields` | `Object` | `{}` |
| `customerCustomizingFields` | `Object` | `{}` |

### API Endpoints

#### `GET /api/v1/customizings/fields/`

**Action:** `loadCustomerCustomizingFields()`

---

## Module: field

### API Endpoints

#### `GET /api/v1/customizings/fields`

**Action:** `loadAllFieldByOrganization(organizationId)`

**Note:** `organizationId` parameter was accepted but never used. Response was discarded — only status code returned.

---

## Module: idCard

### State

| Field | Type | Default |
|---|---|---|
| `idCards` | `Array` | `[]` |
| `idCard` | `Object` | `{}` |
| `customerConfiguration` | `Object` | `{}` |

### API Endpoints

#### `GET /api/v1/id-cards`

**Action:** `loadIdCards(params)`

#### `GET /api/v1/id-cards?person_id={personId}`

**Action:** `loadIdCardByPersonId(personId)`

#### `POST /api/v1/id-cards`

**Action:** `createIdCard(idCard)`

#### `PUT /api/v1/id-cards/{id}`

**Action:** `updateIdCard(idCard)` / `extendIdCard({ idCard, yearsToExtend })`

`extendIdCard` calculates new validity client-side by adding `yearsToExtend` years.

#### `DELETE /api/v1/id-cards/{id}`

**Action:** `deleteIdCard(idCard)`

#### `PUT /api/v1/id-cards/{id}/approve`

**Action:** `approveIdCard(idCard)`

#### `PUT /api/v1/id-cards/{id}/reset-activation`

**Action:** `resetIdCard(idCard)`

#### `PUT /api/v1/id-cards/{id}/deactivation`

**Action:** `deactivateIdCard(idCard)`

---

## Module: person

### State

| Field | Type | Default |
|---|---|---|
| `person` | `Object` | `{}` |
| `persons` | `Array` | `[]` |
| `files` | `Array` | `[]` |

### API Endpoints

#### `GET /api/v1/persons/{personId}`

**Action:** `loadPerson(personId)`

#### `GET /api/v1/persons/{personId}/files?file_name=Fernpiloten-Zeugnis`

**Action:** `loadPersonFiles(personId)`

**Note:** `file_name` hardcoded to `"Fernpiloten-Zeugnis"` (remote pilot certificate).

#### `GET /api/v1/persons?organisation_id={organizationId}`

**Action:** `loadPersonsByOrganization(organizationId)`

#### `POST /api/v1/persons`

**Action:** `createPerson(person)`

**Request body:**
```json
{
  "first_name": "", "last_name": "", "phone_number": "", "email": "",
  "date_of_birth": "", "driver_license_class": "", "organisation_id": "",
  "role": "", "department": "", "profile_image_id": "", "id_number": "",
  "extra_1": "", "extra_2": "", "extra_3": "", "extra_4": "",
  "extra_5": "", "extra_6": "", "external_url": ""
}
```

#### `POST /api/v1/persons/import?autocreate_id_card=true`

**Action:** `createBatchPerson(persons)`

**Request body:** Array of person objects. `autocreate_id_card=true` hardcoded.

#### `PUT /api/v1/persons/{id}`

**Action:** `updatePerson(person)`

#### `POST /api/v1/files`

**Action:** `createFile(file)`

**Headers:** `content-type: application/octet-stream`. Query params: `organisation_id`, `qr_code=true`.

#### `POST /api/v1/persons/{personId}/files`

**Action:** `createPersonFile(fileId)`

**Note:** `file_name` hardcoded to `"Fernpiloten-Nachweis"`.

#### `GET https://exam.lba-openuav.de/api/DroneConfig/GetDroneCertificateVerificationDialogueDataDTO?cipher={id}`

**Action:** `getRemotepilot(id)`

**Note:** External API call to the German Federal Aviation Authority (LBA) drone certification system. No auth headers.

#### `DELETE /api/v1/persons/{personId}/files/{fileId}`

**Action:** `deleteFile(fileId)`

---

## Module: user

### State

| Field | Type | Default |
|---|---|---|
| `user` | `Object` | `{}` |
| `users` | `Array` | `[]` |

### API Endpoints

#### `GET /api/v1/accounts/{userId}`

**Action:** `loadUser(userId)`

**Query parameters:** `customer_id` (from auth user).

#### `GET /api/v1/accounts`

**Action:** `loadUsers()`

**Query parameters:** `customer_id` (from auth user).

#### `POST /api/v1/accounts`

**Action:** `createUser(user)`

**Request body:**
```json
{
  "username": "", "email": "", "is_customer_admin": false,
  "password": "", "organisation_mappings": []
}
```

#### `PUT /api/v1/accounts/{id}`

**Action:** `updateUser(user)`

#### `DELETE /api/v1/accounts/{id}`

**Action:** `deleteUser(userId)`

---

## Module: index (Registry)

Imported and re-exported all modules as a flat object for Vuex store registration:

```
auth, bonus, organization, user, customizing, changeRequest,
idCard, field, layout, core, person, customer
```

---

## Missing Modules

The following modules were imported in `index.js` but had no corresponding files:

- **`organization.js`** — Likely handled CRUD for organizations/departments within a customer.
- **`layout.js`** — Likely managed ID card layout/template configuration.

---

## Known Bugs & Issues

1. **`bonus.js`** — `getOrgs` getter references `state.oranisations` (typo, never declared). Always returns `undefined`.
2. **`changeRequest.js`** — Duplicate `params` key in request config. Second `params: params` silently overwrites first `params: { customer_id }`, so `customer_id` is never sent.
3. **`idCard.js`** — `getExpiredIdCards` uses `i < state.idCards` instead of `state.idCards.length`. Coerces array to NaN, loop never executes.
4. **`idCard.js`** — `methods` block on a Vuex module is not supported. `deleteIdCard` helper is unreachable.
5. **`idCard.js`** — `updateIdCard` and `approveIdCard` accept 3 arguments but Vuex actions only receive 2 (`context` + `payload`). Third argument always `undefined`.
6. **`customer.js`** — `updateDataAgreement` sends hardcoded `dpp_text: "string"` placeholder.
7. **`person.js`** — Actions access `this.state.person` instead of `ctx.state`. Works but bypasses namespacing.
8. **`auth.js`** — `setLoginTime` mutation ignores payload, always sets current timestamp. `makeLogout`'s intent to reset to 0 is silently ignored.
9. **`user.js`** — `updateUser` admin/non-admin branches send identical payloads. Dead branching logic.
10. **`core.js`** — `createImage` returns raw promise with commented-out error handling.
11. **`field.js`** — `loadAllFieldByOrganization` ignores its parameter and stores nothing.
12. **`index.js`** — `organization.js` and `layout.js` imports reference missing files.

---

## Complete API Endpoint Summary

| Method | URL | Module | Action |
|---|---|---|---|
| `POST` | `/api/v1/accounts/login` | auth | `createLogin` |
| `PUT` | `/api/v1/accounts/password` | auth | `changePassword` |
| `POST` | `/api/v1/accounts/token/refresh` | auth | `refreshToken` |
| `POST` | `/api/v1/accounts/logout` | auth | `makeLogout` |
| `PUT` | `/api/v1/accounts/resetPassword` | auth | `resetPassword` |
| `GET` | `/api/v1/bonuses` | bonus | `loadBonuses` |
| `GET` | `/api/v1/bonuses/{id}` | bonus | `loadBonus` |
| `POST` | `/api/v1/bonuses` | bonus | `createBonus` |
| `PUT` | `/api/v1/bonuses/{id}` | bonus | `updateBonus` |
| `DELETE` | `/api/v1/bonuses/{id}` | bonus | `deleteBonus` |
| `PUT` | `/api/v1/bonuses/{bonusId}/organisations` | bonus | `addOrganisationToBonus` |
| `GET` | `/api/v1/bonuses/{bonusId}/organisations` | bonus | `loadBonusOrganisations` |
| `GET` | `/api/v1/bonuses/{bonusId}/organisations/{orgId}` | bonus | `getBonusOrganisation` |
| `DELETE` | `/api/v1/bonuses/{bonusId}/organisations/{orgId}` | bonus | `removeOrganisationFromBonus` |
| `GET` | `/api/v1/change-requests` | changeRequest | `loadChangeRequests` |
| `PUT` | `/api/v1/change-requests/{id}/review?accept={v}` | changeRequest | `reviewAmendment` |
| `GET` | `/api/v1/images/{id}` | core | `loadImage` / `getImage64` |
| `POST` | `/api/v1/images` | core | `createImage` |
| `DELETE` | `/api/v1/images/{id}` | core | `deleteImage` |
| `GET` | `/api/v1/dashboard/stats` | core | `loadDashboardStats` |
| `GET` | `/api/v1/customers/{id}` | customer | `loadCustomer` |
| `PUT` | `/api/v1/customers/{id}` | customer | `updateCustomer` |
| `GET` | `/api/v1/customers/{id}/configuration` | customer | `loadCustomerConfiguration` |
| `PUT` | `/api/v1/customers/{id}/configuration` | customer | `updateCustomerConfiguration` |
| `PUT` | `/api/v1/customers/{id}/dpp` | customer | `updateDataAgreement` |
| `DELETE` | `/api/v1/customers/{id}/dpp` | customer | `deleteCustomerDpp` |
| `GET` | `/api/v1/customizings/fields/` | customizing | `loadCustomerCustomizingFields` |
| `GET` | `/api/v1/customizings/fields` | field | `loadAllFieldByOrganization` |
| `GET` | `/api/v1/id-cards` | idCard | `loadIdCards` |
| `GET` | `/api/v1/id-cards?person_id={id}` | idCard | `loadIdCardByPersonId` |
| `POST` | `/api/v1/id-cards` | idCard | `createIdCard` |
| `PUT` | `/api/v1/id-cards/{id}` | idCard | `updateIdCard` / `extendIdCard` |
| `DELETE` | `/api/v1/id-cards/{id}` | idCard | `deleteIdCard` |
| `PUT` | `/api/v1/id-cards/{id}/approve` | idCard | `approveIdCard` |
| `PUT` | `/api/v1/id-cards/{id}/reset-activation` | idCard | `resetIdCard` |
| `PUT` | `/api/v1/id-cards/{id}/deactivation` | idCard | `deactivateIdCard` |
| `GET` | `/api/v1/persons/{id}` | person | `loadPerson` |
| `GET` | `/api/v1/persons/{id}/files?file_name=Fernpiloten-Zeugnis` | person | `loadPersonFiles` |
| `GET` | `/api/v1/persons?organisation_id={id}` | person | `loadPersonsByOrganization` |
| `POST` | `/api/v1/persons` | person | `createPerson` |
| `POST` | `/api/v1/persons/import?autocreate_id_card=true` | person | `createBatchPerson` |
| `PUT` | `/api/v1/persons/{id}` | person | `updatePerson` |
| `POST` | `/api/v1/files` | person | `createFile` |
| `POST` | `/api/v1/persons/{id}/files` | person | `createPersonFile` |
| `DELETE` | `/api/v1/persons/{id}/files/{fileId}` | person | `deleteFile` |
| `GET` | `https://exam.lba-openuav.de/...` | person | `getRemotepilot` |
| `GET` | `/api/v1/accounts/{userId}` | user | `loadUser` |
| `GET` | `/api/v1/accounts` | user | `loadUsers` |
| `POST` | `/api/v1/accounts` | user | `createUser` |
| `PUT` | `/api/v1/accounts/{id}` | user | `updateUser` |
| `DELETE` | `/api/v1/accounts/{id}` | user | `deleteUser` |
