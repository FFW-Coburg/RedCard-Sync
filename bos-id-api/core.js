import Vue from "vue";

export default {
  namespaced: true,
  state: {
    image: null,
    dashboardStats: {
      openChangeRequests: 0,
      openIdCards: 0,
      expiredIdCards: 0,
    },
  },

  getters: {
    getImage(state) {
      return state.image;
    },
    getDashboardStats(state) {
      return state.dashboardStats;
    },
  },

  mutations: {
    setImage(state, image) {
      state.image = image;
    },
    setDashboardStats(state, dashboardStats) {
      state.dashboardStats = dashboardStats;
    },
  },

  actions: {
    async loadImage(ctx, id) {
      if (id === undefined || id === null) {
        return;
      }

      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/images/" + id;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          // // console.log(error(resp.data)
          ctx.commit("setImage", resp.data);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          ctx.commit("setImage", null);
          return error.response.status;
        });
    },

    async getImage64(ctx, id) {
      if (id === undefined || id === null) {
        return;
      }

      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/images/" + id;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then(async (resp) => {
          console.log("getIMG", resp);
          return await resp.data.encoded_image_data;
        })
        .catch((error) => {
          console.log("ERROR", error);
          return error.response.status;
        });
    },

    async createImage(ctx, base64EncodedString) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/images";
      return Vue.prototype.axios({
        method: "post",
        url: url,
        data: {
          encoded_image_data: base64EncodedString,
        },
        headers: headers,
      });

      // .then(resp => {
      //     // console.log(error(resp.data)
      //     ctx.dispatch('loadImage', resp.data.            organizationCount: 0,id)
      //     // return resp.data.id
      // }).catch(error => {
      //     // console.log(error)
      //     ctx.commit('setImage', null)
      //     // return false
      // })
    },

    async deleteImage(ctx, id) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/images/" + id;
      return await Vue.prototype
        .axios({
          method: "delete",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          // console.log(error(resp.data)
          ctx.dispatch("loadImage", null);
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          ctx.commit("setImage", null);
          return error.response.status;
        });
    },

    async loadDashboardStats(ctx) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/dashboard/stats";
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then(async (resp) => {
          const stats = {
            openChangeRequests: resp.data.openChangeRequestsAmount,
            openIdCards: resp.data.idCardsAmount.open,
            expiredIdCards: resp.data.idCardsAmount.expired,
          };

          ctx.commit("setDashboardStats", stats);
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },

    notification(ctx) {
      // console.log(error(Vue.prototype)
      Vue.$vs.notify({
        color: "danger",
        position: "bottom-right",
        title: "ALLLES GUT",
      });
    },
  },
};
