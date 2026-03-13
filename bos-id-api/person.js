import Vue from "vue";

export default {
  namespaced: true,
  state: {
    person: {},
    persons: [],
    files: [],
  },
  getters: {
    getPerson(state) {
      return state.person;
    },
    getPersons(state) {
      return state.persons;
    },
    getFiles(state) {
      return state.files;
    },
  },

  mutations: {
    setFiles(state, files) {
      state.files = files;
    },
    setPersons(state, persons) {
      state.persons = persons;
    },
    setPerson(state, person) {
      state.person = person;
    },
  },

  actions: {
    async loadPerson(ctx, personId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/persons/" + personId;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          if (resp.status === 200) {
            const person = resp.data;
            ctx.commit("setPerson", person);
          }
          return resp.status;
        })
        .catch((error) => {
          // console.log(error)
          return error.response.status;
        });
    },
    async loadPersonFiles(ctx, personId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url =
        "/api/v1/persons/" + personId + "/files?file_name=Fernpiloten-Zeugnis";
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          if (resp.status === 200) {
            const files = resp.data;
            ctx.commit("setFiles", files);
          }
          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },
    async loadPersonsByOrganization(ctx, organizationId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/persons?organisation_id=" + organizationId;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
          headers: headers,
        })
        .then((resp) => {
          if (resp.status === 200) {
            const persons = resp.data;
            ctx.commit("setPersons", persons);
          }
          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },

    async createPerson(ctx, person) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const url = "/api/v1/persons";
      return await Vue.prototype
        .axios({
          method: "post",
          url: url,
          data: {
            first_name: person.first_name,
            last_name: person.last_name,
            phone_number: person.phone_number,
            email: person.email,
            date_of_birth: person.date_of_birth,
            driver_license_class: person.driver_license_class,
            organisation_id: person.organisation_id,
            role: person.role,
            department: person.department,
            profile_image_id: person.profile_image_id,
            id_number: person.id_number,
            extra_1: person.extra_1,
            extra_2: person.extra_2,
            extra_3: person.extra_3,
            extra_4: person.extra_4,
            extra_5: person.extra_5,
            extra_6: person.extra_6,
            external_url: person.external_url,
          },
          headers: headers,
        })
        .then((resp) => {
          const person = resp.data;
          ctx.dispatch("idCard/loadIdCards", {}, { root: true });
          ctx.commit("setPerson", person);
          ctx.dispatch("loadPerson", person.id);
          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },

    async createBatchPerson(ctx, persons) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const url = "/api/v1/persons/import?autocreate_id_card=true";
      return await Vue.prototype
        .axios({
          method: "post",
          url: url,
          data: persons,
          headers: headers,
        })
        .then((resp) => {
          ctx.dispatch("idCard/loadIdCards", {}, { root: true });
          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },

    async updatePerson(ctx, person) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });

      const url = "/api/v1/persons/" + person.id;
      return await Vue.prototype
        .axios({
          method: "put",
          url: url,
          data: {
            first_name: person.first_name,
            last_name: person.last_name,
            phone_number: person.phone_number,
            email: person.email,
            date_of_birth: person.date_of_birth,
            driver_license_class: person.driver_license_class,
            organisation_id: person.organisation_id,
            role: person.role,
            department: person.department,
            profile_image_id: person.profile_image_id,
            id_number: person.id_number,
            extra_1: person.extra_1,
            extra_2: person.extra_2,
            extra_3: person.extra_3,
            extra_4: person.extra_4,
            extra_5: person.extra_5,
            extra_6: person.extra_6,
            external_url: person.external_url,
          },
          headers: headers,
        })
        .then((resp) => {
          const person = resp.data;
          ctx.commit("setPerson", person);
          ctx.dispatch("idCard/loadIdCards", {}, { root: true });

          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },
    async createFile(ctx, file) {
      const headers = await ctx.dispatch("auth/getHeadersUpload", null, {
        root: true,
      });
      const url = "/api/v1/files";
      const p = this.state.person;
      return await Vue.prototype.axios
        .post(url, file, {
          params: { organisation_id: p.person.organisation_id, qr_code: true },
          headers: headers,
        })
        .then(async (resp) => {
          return resp.data;
        })
        .catch((error) => {
          return error.response.status;
        });
    },
    async createPersonFile(ctx, fileId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const p = this.state.person;
      const url = `/api/v1/persons/${p.person.id}/files`;
      return await Vue.prototype
        .axios({
          method: "post",
          url: url,
          data: {
            file_name: "Fernpiloten-Nachweis",
            file_id: fileId,
          },
          headers: headers,
        })
        .then((resp) => {
          const person = resp.data;
          ctx.commit("setPerson", person);
          ctx.dispatch("idCard/loadIdCards", {}, { root: true });
          return resp.status;
        })
        .catch((error) => {
          return error.response.status;
        });
    },
    async getRemotepilot(ctx, id) {
      const url = `https://exam.lba-openuav.de/api/DroneConfig/GetDroneCertificateVerificationDialogueDataDTO?cipher=${id}`;
      return await Vue.prototype
        .axios({
          method: "get",
          url: url,
        })
        .then((resp) => {
          return resp.data;
        })
        .catch((error) => {
          return error.response.status;
        });
    },
    async deleteFile(ctx, fileId) {
      const headers = await ctx.dispatch("auth/getHeaders", null, {
        root: true,
      });
      const p = this.state.person;
      const url = `/api/v1/persons/${p.person.id}/files/${fileId}`;
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
          return error.response.status;
        });
    },
  },
};
