import router from "@/router";
import Vue from "vue";

export default {
  namespaced: true,
  state: {
    loginTime: 0,
    user: {},
  },

  getters: {
    getUser(state) {
      return state.user;
    },
    getAccessToken(state) {
      return state.user.token;
    },
  },

  mutations: {
    setLoginTime(state) {
      // console.log(error("Set Login Time")
      state.loginTime = Math.round(new Date().getTime() / 1000);
    },
    setUser(state, user) {
      state.user = user;
    },
    setAccessToken(state, token) {
      state.user.token = token;
    },
  },

  actions: {
    async createLogin(ctx, account) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/accounts/login";
      return await Vue.prototype
        .axios({
          method: "post",
          url: url,
          data: {
            email: account.email,
            password: account.password,
          },
          headers: headers,
        })
        .then(async (resp) => {
          const user = resp.data;
          ctx.commit("setUser", user);
          ctx.commit("setLoginTime");
          // // console.log(error("Initial token:")
          // // console.log(error(resp.data.token)
          return resp.status;
        })
        .catch((error) => {
          // // console.log(error)
          return error.response.status;
        });
    },

    async changePassword(ctx, data) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/accounts/password";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: {
            email: data.email,
            password: data.password_new,
          },
          headers: headers,
        })
        .then((resp) => {
          // // console.log(error(resp)
          ctx.dispatch("makeLogout");
        })
        .catch((error) => {
          // // console.log(error)
        });
    },

    async refreshToken(ctx) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const validityMinutes = 60;

      const url = "/api/v1/accounts/token/refresh";
      return await Vue.prototype
        .axios({
          method: "post",
          headers: headers,
          url: url,
          data: {
            token: ctx.state.user.token,
            validityMinutes: validityMinutes,
          },
        })
        .then(async (resp) => {
          const user = resp.data;
          await ctx.commit("setUser", user);
          await ctx.commit("setLoginTime");
          // // console.log(error("New received token:")
          // // console.log(error(resp.data.token)
          ctx.commit("setAccessToken", resp.data.token);
          // // console.log(error("Refreshed Token.....")
        })
        .catch((error) => {
          // // console.log(error)
        });
    },

    async makeLogout(ctx) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/accounts/logout";
      return await Vue.prototype
        .axios({
          method: "post",
          headers: headers,
          url: url,
        })
        .then(async (resp) => {
          await ctx.commit("setLoginTime", 0);
          await ctx.commit("setUser", {});
          router.push({ name: "Login" });
        })
        .catch((error) => {
          // // console.log(error)
        });
    },

    async hasAdminPermission(ctx) {
      // const isAuthenticated = await ctx.dispatch(this.isAuthenticated)

      // if (isAuthenticated) {
      // Check for key
      if ("is_customer_admin" in ctx.state.user) {
        //  Check for Value
        if (ctx.state.user.is_customer_admin) {
          return true;
        }
      }
      // }

      return false;
    },

    async hasUserPermission(ctx, department) {
      if (ctx.state.user.is_customer_admin) {
        return true;
      } else {
        if ("organisation_mappings" in ctx.state.user) {
          return ctx.state.user.organisation_mappings.find((o) => {
            if (department == "Organizations" && o.organisation_permission) {
              return true;
            } else if (department == "Users" && o.account_permission) {
              return true;
            } else if (department == "IdCard" && o.id_card_permission) {
              return true;
            } else if (department == "Amendments" && o.id_card_permission) {
              return true;
            } else if (
              department == "UnapprovedIDCards" &&
              o.id_card_permission
            ) {
              return true;
            } else if (department == "ExpiredIDCards" && o.id_card_permission) {
              return true;
            } else {
              return false;
            }
          });
        }
        return false;
      }
    },

    async isAuthenticated(ctx) {
      // // Check Session
      const now = Math.round(new Date().getTime() / 1000);
      const sessionTime = 60 * 5;

      if (
        ctx.state.user.hasOwnProperty("token") &&
        now < ctx.state.loginTime + sessionTime
      ) {
        return true;
      }

      return false;
    },

    async resetPassword(ctx, email) {
      const url = "/api/v1/accounts/resetPassword";
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: {
            email: email,
          },
        })
        .then((resp) => {
          router.push({ name: "Login" });
        })
        .catch((error) => {
          // // console.log(error)
        });
    },

    async getHeaders(ctx) {
      if (await ctx.dispatch("isAuthenticated")) {
        // // console.log(error("Using Token:")
        // // console.log(error(ctx.getters['getAccessToken'])
        return {
          "X-Requested-With": "XMLHttpRequest",
          Authorization: `Bearer ${ctx.getters["getAccessToken"]}`,
        };
      } else {
        return {
          "X-Requested-With": "XMLHttpRequest",
        };
      }
    },

    async getHeadersUpload(ctx) {
      if (await ctx.dispatch("isAuthenticated")) {
        return {
          "content-type": "application/octet-stream",
          "X-Requested-With": "XMLHttpRequest",
          Authorization: `Bearer ${ctx.getters["getAccessToken"]}`,
        };
      } else {
        return {
          "X-Requested-With": "XMLHttpRequest",
        };
      }
    },
  },
};
