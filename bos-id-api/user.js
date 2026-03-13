import Vue from 'vue'



export default {
    namespaced: true,
    state: {
        user: {},
        users: [],
    },
    getters: {
        getUser(state) {
            return state.user
        },
        getUsers(state) {
            return state.users
        }
    },

    mutations: {
        setUsers(state, users) {
            state.users = users
        },
        setUser(state, user) {
            state.user = user
        }
    },

    actions: {
        async loadUser(ctx, userId) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })
            const user = await ctx.rootGetters['auth/getUser']

            
            const url =  '/api/v1/accounts/' + userId
            return await Vue.prototype.axios({
                method: "get",
                params: { customer_id: user.customer_id },
                url: url,
                headers: headers
            }).then(resp => {
                const user = resp.data
                ctx.commit('setUser', user)
                                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },

        async loadUsers(ctx) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })
            const user = await ctx.rootGetters['auth/getUser']


            const url =  '/api/v1/accounts'
            return await Vue.prototype.axios({
                method: "get",
                url: url,
                params: { customer_id: user.customer_id },
                headers: headers
            }).then(resp => {
                const users = resp.data
                ctx.commit('setUsers', users)
                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },


        async createUser(ctx, user) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })
            // const user = await ctx.rootGetters['auth/getUser']
            

            const url =  '/api/v1/accounts'
            return await Vue.prototype.axios({
                method: "post",
                url: url,
                // params: { customer_id: user.customer_id },
                data: {
                    username: user.username,
                    email: user.email,
                    is_customer_admin: user.is_customer_admin,
                    password: user.password,
                    organisation_mappings: user.organisation_mappings,
                },
                headers: headers
            }).then(resp => {
                const user = resp.data
                ctx.commit('setUser', user)
                ctx.dispatch('loadUsers')
                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },


        async updateUser(ctx, user) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })

            //FEHLERMELDUNG: idCard is not defined? -> Daher auskommentiert!
            // if (user.hasOwnProperty('password_confirm')) {
            //     delete idCard.password_confirm;
            // } 
            
            const url =  '/api/v1/accounts/' + user.id;
            if (user.is_customer_admin) {
                return await Vue.prototype.axios({
                    method: "put",
                    url: url,
                    data: {
                        username: user.username,
                        password: user.password,
                        email: user.email,
                        is_customer_admin: user.is_customer_admin,
                        organisation_mappings: user.organisation_mappings

                    },
                    headers: headers
                }).then(resp => {
                    const user = resp.data
                    ctx.commit('setUser', user)
                    ctx.dispatch('loadUsers')
                    return resp.status
                }).catch(error => {
                    // console.log(error)
                    return error.response.status
                })
            } else {
                return await Vue.prototype.axios({
                    method: "put",
                    url: url,
                    data: {
                        username: user.username,
                        password: user.password,
                        email: user.email,
                        is_customer_admin: user.is_customer_admin,
                        organisation_mappings: user.organisation_mappings
                    },
                    headers: headers
                }).then(resp => {
                    const user = resp.data
                    ctx.commit('setUser', user)
                    ctx.dispatch('loadUsers')
                    return resp.status
                }).catch(error => {
                    // console.log(error)
                    return error.response.status
                })
            }
        },


        async deleteUser(ctx, userId) {
            const headers = await ctx.dispatch('auth/getHeaders', null, { root: true })

            const url =  '/api/v1/accounts/' + userId
            return await Vue.prototype.axios({
                method: "delete",
                url: url,
                headers: headers
            }).then(resp => {
                    ctx.dispatch('loadUsers')
                                return resp.status
            }).catch(error => {
                // console.log(error)
                return error.response.status
            })
        },


    },


}
