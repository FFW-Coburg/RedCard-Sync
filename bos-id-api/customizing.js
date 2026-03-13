import Vue from 'vue'



export default {
    namespaced: true,
    state: {
        customizingFields: {},
        customerCustomizingFields: {}
    },


    getters: {
        getCustomizingFields(state) {
            return state.customizingFields
        },
        getCustomerCustomizingFields(state) {
            return state.customerCustomizingFields
        }
    },

    mutations: {
        setCustomizingFields(state, customizingFields) {
            state.customizingFields = customizingFields
        },
        setCustomerCustomizingFields(state, customerCustomizingFields) {
            state.customerCustomizingFields = customerCustomizingFields
        }
    },

    actions: {
        async loadCustomerCustomizingFields(ctx) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })

            const url =  '/api/v1/customizings/fields/'
            return await Vue.prototype.axios({
                method: "get",
                url: url,
                headers: headers
            }).then(resp => {
                ctx.commit('setCustomerCustomizingFields', resp.data)
                return resp.status
            }).catch(error => {
                // // console.log(error)
                return error.response.status
            })
        },
    },

    modules: {

    }
}
