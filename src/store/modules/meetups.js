import { get, post, patch, deleteOne } from '@/api/api';
import Vue from 'vue';
// import { errorMesssage } from '@/utils/utils';
import _ from 'lodash';
const SET_MEETUPS = 'SET_MEETUPS';
const SET_MEETUP = 'SET_MEETUP';
const MEETUP_JOINED_PEOPLE = 'MEETUP_JOINED_PEOPLE';
import catchError from '../catchError';

export default {
    namespaced: true,
    state: {
        meetups: null,
        meetup: null
    },
    getters: {
        meetups: state => state.meetups,
        meetup: state => state.meetup
    },
    mutations: {
        [SET_MEETUPS]: (state, meetups) => (state.meetups = meetups),
        [SET_MEETUP]: (state, meetup) => (state.meetup = meetup),
        [MEETUP_JOINED_PEOPLE](state, joinedPeople) {
            Vue.set(state.meetup, 'joinedPeople', joinedPeople);
        }
    },
    actions: {
        fetchMeetups: catchError(async ({ state, commit }) => {
            commit(SET_MEETUPS, null);
            const res = await get('meetups');
            commit(SET_MEETUPS, res.data.data);
            return state.meetups;
        }),
        fetchMeetup: catchError(async ({ commit, state }, meetupSlug) => {
            commit(SET_MEETUP, null);
            const res = await get(`meetups/${meetupSlug}`);
            commit(SET_MEETUP, res.data.data);
            return state.meetup;
        }),
        async createMeetup(context, data) {
            try {
                const form = new FormData();
                if (Array.isArray(data.images)) {
                    data.images.forEach(image => form.append('images', image));
                }
                form.append('data', JSON.stringify(_.omit(data, ['images'])));

                const res = await post('meetups/create-meetup', form);
                return res.data.data;
            } catch (error) {
                console.log(error.response);
                const { data } = error.response;
                if (data.error) {
                    const err = Object.values(data.error);
                    return Promise.reject(err);
                } else {
                    return Promise.reject(error.message);
                }
            }
        },
        joinMeetup: catchError(async ({ getters, rootGetters, commit, dispatch }, meetupId) => {
            if (!getters.meetup || !rootGetters['auth/isAuthenticated']) return;
            const user = rootGetters['auth/user'];
            const { data } = await patch(`meetups/${meetupId}/join`);
            commit(MEETUP_JOINED_PEOPLE, [
                ...getters.meetup.joinedPeople,
                _.pick(user, ['id', 'name', 'username'])
            ]);

            dispatch('auth/meetupToUser', { type: 'inc', meetupId }, { root: true });
            return data.data;
        }),
        leaveMeetup: catchError(
            async ({ getters: { meetup }, rootGetters, commit, dispatch }, meetupId) => {
                if (!meetup || !rootGetters['auth/isAuthenticated']) return;
                const user = rootGetters['auth/user'];
                const { data } = await deleteOne(`meetups/${meetupId}/leave`);
                commit(
                    MEETUP_JOINED_PEOPLE,
                    meetup.joinedPeople.filter(mt => mt.id !== user.id)
                );
                dispatch('auth/meetupToUser', { type: 'dec', meetupId }, { root: true });
                return data.data;
            }
        )
    }
};
