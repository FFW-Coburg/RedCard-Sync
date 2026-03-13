import Vue from "vue";
import axios from "axios";

export default {
  namespaced: true,
  state: {
    idCards: [],
    idCard: {},
    customerConfiguration: {},
  },

  getters: {
    getIdCards(state) {
      return state.idCards;
    },
    getIdCard(state) {
      return state.idCard;
    },
    getExpiredIdCards(state) {
      let expiredIdCards = [];
      for (var i = 0; i < state.idCards; i++) {
        if (state.idCards[i].deactivated_at !== null) {
          expiredIdCards.push(state.idCards[i]);
        }
      }
      return expiredIdCards;
    },
    getCustomerConfiguration(state) {
      return state.customerConfiguration;
    },
  },
  methods: {
    deleteIdCard(idCard) {
      if (idCard.hasOwnProperty("person_first_name")) {
        delete idCard.person_first_name;
      }
      if (idCard.hasOwnProperty("person_last_name")) {
        delete idCard.person_last_name;
      }
      if (idCard.hasOwnProperty("organisation_name")) {
        delete idCard.organisation_name;
      }
      if (idCard.hasOwnProperty("id")) {
        delete idCard.id;
      }
      if (idCard.hasOwnProperty("created_at")) {
        delete idCard.created_at;
      }
      if (idCard.hasOwnProperty("updated_at")) {
        delete idCard.updated_at;
      }
      if (idCard.hasOwnProperty("organisation_id")) {
        delete idCard.organisation_id;
      }
    },
  },
  mutations: {
    setIdCards(state, idCards) {
      state.idCards = idCards;
    },
    setIdCard(state, idCard) {
      state.idCard = idCard;
    },
  },

  actions: {
    async loadIdCards(ctx, params) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const user = await ctx.rootGetters["auth/getUser"];

      const url = "/api/v1/id-cards";
      return await Vue.prototype
        .axios({
          method: "get",
          params: params,
          url: url,
          headers: headers,
        })
        .then((resp) => {
          const idCards = resp.data;
          ctx.commit("setIdCards", idCards);
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async loadIdCardByPersonId(ctx, personId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/id-cards?person_id=" + personId;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          const idCard = resp.data;
          ctx.commit("setIdCard", idCard);
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async createIdCard(ctx, idCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/id-cards";
      return await Vue.prototype
        .axios({
          method: "post",
          url: url,
          data: idCard,
          headers: headers,
        })
        .then((resp) => {
          ctx.commit("setIdCard", resp.data);

          ctx.dispatch("loadIdCards");
          return resp;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async updateIdCard(ctx, idCard, delIdCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const url = "/api/v1/id-cards/" + idCard.id;

      if (delIdCard) {
        deleteIdCard(idCard);
      }

      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          // data: idCard,
          data: {
            valid_until: idCard.valid_until,
          },
          headers: headers,
        })
        .then((resp) => {
          ctx.commit("setIdCard", resp.data);
          ctx.dispatch("loadIdCards");
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          ctx.dispatch("loadIdCards");
          return error.response.status;
        });
    },

    async deleteIdCard(ctx, idCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/id-cards/" + idCard.id;
      return await Vue.prototype
        .axios({
          method: "delete",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", null, { root: true });
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },
    async approveIdCard(ctx, idCard, delIdCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const url = "/api/v1/id-cards/" + idCard.id + "/approve";

      if (delIdCard) {
        deleteIdCard(idCard);
      }

      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          headers: headers,
          data: {
            valid_until: idCard.valid_until,
          },
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", null, { root: true });
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async extendIdCard(ctx, { idCard, yearsToExtend }) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      // Neues gültig-bis-Datum berechnen
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + yearsToExtend);
      console.log("Neues Datum:", validUntil.toISOString());

      const url = "/api/v1/id-cards/" + idCard.id;

      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          headers: headers,
          data: {
            valid_until: validUntil.toISOString(),
          },
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", null, { root: true });
          return resp.status;
        })
        .catch((error) => {
          return error?.response?.status || 500;
        });
    },

    async resetIdCard(ctx, idCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/id-cards/" + idCard.id + "/reset-activation";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", null, { root: true });
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async deactivateIdCard(ctx, idCard) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/id-cards/" + idCard.id + "/deactivation";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", null, { root: true });
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },
  },
};
