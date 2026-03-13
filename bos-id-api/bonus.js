import Vue from "vue";

export default {
  namespaced: true,
  state: {
    bonuses: [],
    bonus: {},
  },
  getters: {
    getBonuses(state) {
      return state.bonuses;
    },
    getBonus(state) {
      return state.bonus;
    },
    getOrgs(state) {
      return state.oranisations;
    },
  },
  mutations: {
    setBonuses(state, bonuses) {
      state.bonuses = bonuses;
    },
    setBonus(state, bonus) {
      state.bonus = bonus;
    },
  },
  actions: {
    async loadBonuses(ctx) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      try {
        const resp = await Vue.prototype.axios.get("/api/v1/bonuses", {
          headers,
        });

        const mapped = await Promise.all(
          resp.data.map(async (b) => {
            // Adresse immer als Objekt normalisieren
            const address =
              typeof b.address === "string" || !b.address
                ? { name: b.address || "" }
                : b.address;

            // Preview-Bild laden
            let previewImage = "/icons/Photo.svg";
            if (b.image_id) {
              try {
                const base64 = await ctx.dispatch(
                  "core/getImage64",
                  b.image_id,
                  {
                    root: true,
                  }
                );
                previewImage = `data:image/png;base64,${base64}`;
              } catch (err) {
                console.error("Fehler beim Laden des Bildes:", err);
              }
            }
            // ✅ Organisations-Mappings für diesen Bonus laden
            let organisations = [];
            try {
              const orgMappings = await ctx.dispatch(
                "loadBonusOrganisations",
                b.id
              );
              organisations = orgMappings.map((o) => o.organisation_id);
            } catch (err) {
              console.error(
                "Fehler beim Laden der Organisations-Mappings:",
                err
              );
            }

            return {
              ...b,
              image_url: b.image_id ? `/api/v1/images/${b.image_id}` : null,
              address,
              categories: Array.isArray(b.categories) ? b.categories : [],
              previewImage,
              organisations,
            };
          })
        );

        ctx.commit("setBonuses", mapped);
      } catch (err) {
        console.error("Fehler beim Laden der Bonuses:", err);
      }
    },

    async loadBonus(ctx, id) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        const resp = await Vue.prototype.axios.get(`/api/v1/bonuses/${id}`, {
          headers,
        });

        const b = resp.data;
        const mapped = {
          ...b,
          image_url: b.image_id ? `/api/v1/images/${b.image_id}` : null,
          address:
            typeof b.address === "string" || !b.address
              ? { name: b.address || "" }
              : b.address,
          categories: Array.isArray(b.categories) ? b.categories : [],
        };

        ctx.commit("setBonus", mapped);
      } catch (err) {
        console.error(`Fehler beim Laden des Bonus ${id}:`, err);
      }
    },

    async createBonus(ctx, bonus) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const user = ctx.rootGetters["auth/getUser"];
      const body = {
        status: bonus.status,
        categories: bonus.categories,
        code: bonus.code,
        global: false,
        start_at: bonus.start_at,
        end_at: bonus.end_at,
        headline_text: bonus.headline_text,
        description_text: bonus.description_text,
        discount_text: bonus.discount_text,
        email: bonus.email,
        phone_number: bonus.phone_number,
        website_url: bonus.website_url,
        shop_url: bonus.shop_url,
        image_id: bonus.image_id || null,
        address: {
          country: bonus.address?.country || "",
          state: bonus.address?.state || "",
          city: bonus.address?.city || "",
          zip_code: bonus.address?.zip_code || "",
          street_address: bonus.address?.street_address || "",
          additional: bonus.address?.additional || "",
          name: bonus.address?.name || "",
        }, // <- direkt als Objekt
        customer_id: user.customer_id,
      };

      try {
        const resp = await Vue.prototype.axios.post("/api/v1/bonuses", body, {
          headers,
        });
        bonus.id = resp.data.id;
        console.log("das die respid", resp.data.id);
        await ctx.dispatch("loadBonuses");
        return resp.status;
      } catch (error) {
        return error.response?.status || 500;
      }
    },

    async updateBonus(ctx, bonus) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const user = ctx.rootGetters["auth/getUser"];
      const body = {
        ...bonus,
        address: bonus.address || {}, // <- direkt als Objekt
        customer_id: user.customer_id,
      };
      try {
        const resp = await Vue.prototype.axios.put(
          `/api/v1/bonuses/${bonus.id}`,
          body,
          { headers }
        );
        await ctx.dispatch("loadBonuses");
        return resp.status;
      } catch (error) {
        return error.response?.status || 500;
      }
    },

    async deleteBonus(ctx, id) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        const resp = await Vue.prototype.axios.delete(`/api/v1/bonuses/${id}`, {
          headers,
        });
        await ctx.dispatch("loadBonuses");
        return resp.status;
      } catch (error) {
        return error.response?.status || 500;
      }
    },
    // Organisation zu Bonus hinzufügen
    async addOrganisationToBonus(ctx, { bonusId, organisationId }) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        const resp = await Vue.prototype.axios.put(
          `/api/v1/bonuses/${bonusId}/organisations`,
          organisationId,
          { headers }
        );
        return resp.data; // Rückgabe des neuen Mappings
      } catch (err) {
        console.error("Fehler beim Hinzufügen der Organisation:", err);
        return null;
      }
    },

    // Alle Organisationen eines Bonus laden
    async loadBonusOrganisations(ctx, bonusId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        const resp = await Vue.prototype.axios.get(
          `/api/v1/bonuses/${bonusId}/organisations`,
          { headers }
        );
        return resp.data; // Array von Mappings
      } catch (err) {
        console.error("Fehler beim Laden der Organisations-Mappings:", err);
        return [];
      }
    },

    // Einzelnes Organisations-Mapping abrufen
    async getBonusOrganisation(ctx, { bonusId, organisationId }) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        const resp = await Vue.prototype.axios.get(
          `/api/v1/bonuses/${bonusId}/organisations/${organisationId}`,
          { headers }
        );
        return resp.data;
      } catch (err) {
        console.error("Fehler beim Laden des Organisations-Mappings:", err);
        return null;
      }
    },

    // Organisation aus Bonus entfernen
    async removeOrganisationFromBonus(ctx, { bonusId, organisationId }) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      try {
        await Vue.prototype.axios.delete(
          `/api/v1/bonuses/${bonusId}/organisations/${organisationId}`,
          { headers }
        );
        return true; // Erfolg
      } catch (err) {
        console.error("Fehler beim Entfernen der Organisation:", err);
        return false; // Fehlerfall
      }
    },
  },
};
