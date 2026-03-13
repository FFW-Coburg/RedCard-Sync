import Vue from 'vue'



export default {
    namespaced: true,
    state: {

    },


    getters: {

    },

    mutations: {

    },

    actions: {
        async loadAllFieldByOrganization(ctx, organizationId) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })

            const url =  '/api/v1/customizings/fields'
            return await Vue.prototype.axios({
                method: "get",
                url: url,
                headers: headers
            }).then(resp => {
                return resp.status
            }).catch(error => {
                // // console.log(error)
                return error.response.status
            })
        }
    },

    modules: {

    }
}
