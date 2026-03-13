import Vue from "vue";

export default {
  namespaced: true,
  state: {
    customer: {},
    customerConfiguration: {},
  },

  getters: {
    getCustomer(state) {
      return state.customer;
    },
    getCustomerConfiguration(state) {
      return state.customerConfiguration;
    },
  },

  mutations: {
    setCustomer(state, customer) {
      state.customer = customer;
    },
    setCustomerConfiguration(state, customerConfiguration) {
      if (state.customerConfiguration !== null) {
        customerConfiguration.filter = state.customerConfiguration.filter;
      } else {
        customerConfiguration.filter = "all";
      }

      state.customerConfiguration = customerConfiguration;
    },
  },

  actions: {
    async loadCustomer(ctx, customerId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/customers/" + customerId;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          const customer = resp.data;

          if (
            customer.invoice_address == null ||
            !customer.hasOwnProperty("invoice_address")
          ) {
            customer.invoice_address = {
              name: null,
              additional: null,
              street_address: null,
              zip_code: null,
              city: null,
              state: null,
              country: null,
            };
          }

          ctx.commit("setCustomer", customer);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },

    async updateCustomer(ctx, customer) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      if (
        customer.invoice_address.name == null &&
        customer.invoice_address.street_address == null &&
        customer.invoice_address.zip_code == null &&
        customer.invoice_address.city == null &&
        customer.invoice_address.state == null &&
        customer.invoice_address.country == null
      ) {
        customer.invoice_address = null;
      }
      const url = "/api/v1/customers/" + customer.id;
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: customer,
          headers: headers,
        })
        .then(async (resp) => {
          await ctx.dispatch("loadCustomer", customer.id);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },

    async loadCustomerConfiguration(ctx, customerId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/customers/" + customerId + "/configuration";
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          const customerConfiguration = resp.data;
          ctx.commit("setCustomerConfiguration", customerConfiguration);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },

    async updateDataAgreement(ctx, customer) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/customers/" + customer.id + "/dpp";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: {
            dpp_text: "string",
          },
          headers: headers,
        })
        .then(async (resp) => {
          await ctx.dispatch("loadCustomerConfiguration", customer.id);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },

    async updateCustomerConfiguration(ctx, customerConfiguration) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url =
        "/api/v1/customers/" +
        customerConfiguration.customer_id +
        "/configuration";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: {
            expiry_warning_days: customerConfiguration.expiry_warning_days,
            id_card_validity: customerConfiguration.id_card_validity,
          },
          headers: headers,
        })
        .then((resp) => {
          // console.log(error(resp)
          ctx.dispatch(
            "loadCustomerConfiguration",
            customerConfiguration.customer_id,
          );
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },
    async deleteCustomerDpp(ctx, customerId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/customers/" + customerId + "/dpp";

      return await Vue.prototype
        .axios({
          method: "delete",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          // Optional: State neu laden oder bereinigen
          // ctx.dispatch("loadCustomerConfiguration", customerId);
          return resp.status;
        })
        .catch((error) => {
          return error.response?.status;
        });
    },
  },

  modules: {},
};
