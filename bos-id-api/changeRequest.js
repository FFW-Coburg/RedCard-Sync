import Vue from 'vue'



export default {
    namespaced: true,
    state: {
        changeRequests: []
    },

    getters: {
        getChangeRequests(state) {
            return state.changeRequests
        }
    },

    mutations: {
        setChangeRequests(state, changeRequests) {
            state.changeRequests = changeRequests
        }
    },

    actions: {
        async loadChangeRequests(ctx, params={ status: 'open'}) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })
            const user = await ctx.rootGetters['auth/getUser']

            const url =  '/api/v1/change-requests'
            return await Vue.prototype.axios({
                method: "get",
                params: { customer_id: user.customer_id },
                url: url,
                params: params,
                headers: headers
            }).then(resp => {
                const changeRequests = resp.data
                ctx.commit('setChangeRequests', changeRequests)
                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },


        async reviewAmendment(ctx, {id, value}) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })

            const url =  '/api/v1/change-requests/' + id + '/review?accept=' + value
            return await Vue.prototype.axios({
                method: "put",
                url: url,
                headers: headers
            }).then(resp => {
                // console.log(error(resp)
                ctx.dispatch('loadChangeRequests')
                                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },
        
    },

}
