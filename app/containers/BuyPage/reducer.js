/* eslint-disable no-case-declarations, no-param-reassign */
import { fromJS } from 'immutable';
import { handleActions } from 'redux-actions';
import {
  LOAD_PRICES,
  LOAD_BEST_PRICE,
  LOAD_PRICES_SUCCESS,
  // LOAD_PRICES_ERROR,
  LOAD_BUY_COIN,
  LOAD_BUY_COIN_SUCCESS,
  LOAD_BUY_COIN_ERROR,
  CLEAR_BUY_COIN_ERROR,
  LOAD_RECENT_SWAPS_COIN,
  LOAD_RECENT_SWAPS_DATA_FROM_WEBSOCKET,
  LOAD_RECENT_SWAPS_ERROR,
  REMOVE_SWAPS_DATA,
  SWAP_TIMEOUT
} from './constants';

import { LOGOUT } from '../App/constants';

// The initial state of the App
export const initialState = fromJS({
  prices: {
    loading: false,
    error: false,
    entities: {}
  },

  // This data struct answers those question:
  // Can I make another swap?
  // Did current swap timeout?
  buying: {
    loading: false,
    error: false
  },

  // This data struct answers those question:
  // How many are swap currently processing?
  // How many did swap finished?
  // Current swap?
  //
  swaps: {
    loading: false,
    error: false,
    processingList: [],
    finishedList: [],
    list: [], // REMOVE ???
    entities: {}
  }
});

const buyReducer = handleActions(
  {
    [LOAD_PRICES]: state =>
      state
        .setIn(['prices', 'loading'], true)
        .setIn(['prices', 'error'], false),

    [LOAD_BEST_PRICE]: (state, { payload }) => {
      const { rel } = payload;
      // step one: load entities
      const entities = state.getIn(['prices', 'entities']);
      // step two: update best price
      const c = entities.get(rel);
      const n = fromJS(payload);
      // if not found
      if (!c) {
        // step three: put it in coin
        n.set('createdAt', Date.now());
      } else {
        n.set('createdAt', c.get('createdAt'));
      }
      n.set('updatedAt', Date.now());
      return state.setIn(['prices', 'entities'], entities.set(rel, n));
    },

    [LOAD_PRICES_SUCCESS]: state => state.setIn(['prices', 'loading'], false),

    [LOAD_BUY_COIN]: state =>
      state
        .setIn(['buying', 'loading'], true)
        .setIn(['buying', 'error'], false),

    [LOAD_BUY_COIN_SUCCESS]: (state, { payload }) => {
      const {
        tradeid,
        uuid,
        requestid,
        quoteid,
        expiration,
        bob,
        alice,
        basevalue,
        relvalue
      } = payload;
      let list = state.getIn(['swaps', 'list']);
      let processingList = state.getIn(['swaps', 'processingList']);
      const entities = state.getIn(['swaps', 'entities']);
      if (!processingList.includes(uuid)) {
        processingList = processingList.push(uuid);
        list = list.push(uuid);
      }

      // step one: update date
      return state
        .setIn(['swaps', 'list'], list)
        .setIn(['swaps', 'processingList'], processingList)
        .setIn(
          ['swaps', 'entities'],
          entities.set(
            uuid,
            fromJS({
              id: tradeid,
              uuid,
              requestid,
              quoteid,
              expiration,
              bob,
              alice,
              bobamount: basevalue,
              aliceamount: relvalue,
              sentflags: [],
              status: 'pending'
            })
          )
        )
        .setIn(['swaps', 'loading'], true);
    },

    [LOAD_BUY_COIN_ERROR]: (state, { error }) =>
      state
        .setIn(['buying', 'error'], error)
        .setIn(['buying', 'loading'], false),

    [CLEAR_BUY_COIN_ERROR]: state =>
      state
        .setIn(['buying', 'error'], false)
        .setIn(['buying', 'loading'], false),

    [LOAD_RECENT_SWAPS_COIN]: (state, { payload }) => {
      // NOTE: still not hanle this case
      // error: "swap never started"
      // uuid: ""
      // status: "finished"
      // bob: ""
      // src: ""
      // alice: ""
      // dest: ""
      // requestid: 1999249337
      // quoteid: 2452050470
      const {
        tradeid,
        uuid,
        requestid,
        quoteid,
        expiration,
        bob,
        alice,
        srcamount,
        destamount,
        sentflags,
        status
      } = payload;
      // stop when not found uuid
      if (!uuid && uuid === '') return state;
      // step one: update list
      let list = state.getIn(['swaps', 'list']);
      let processingList = state.getIn(['swaps', 'processingList']);
      let finishedList = state.getIn(['swaps', 'finishedList']);

      // if (!list.find(e => e === uuid) && status === 'pending') {
      //   list = list.unshift(uuid);
      // }
      // step two: update entities
      let entities = state.getIn(['swaps', 'entities']);
      let entity = entities.get(uuid);
      if (!entity) {
        // set new
        entity = fromJS({
          id: tradeid,
          uuid,
          requestid,
          quoteid,
          expiration,
          bob,
          alice,
          bobamount: srcamount,
          aliceamount: destamount,
          sentflags,
          status
        });
      } else if (entity.get('status') === 'finished') {
        // NOTE: stop update when a swap was finished
        return state;
      } else {
        // update
        // sentflags
        const sentf = entity.get('sentflags');
        if (sentflags && sentf.size < sentflags.length) {
          entity = entity.set('sentflags', fromJS(sentflags));
        }
        entity = entity.merge(
          fromJS({
            id: tradeid,
            uuid,
            requestid,
            quoteid,
            expiration,
            bob,
            alice,
            bobamount: srcamount,
            aliceamount: destamount,
            status
          })
        );
      }
      entities = entities.set(uuid, entity);
      if (status === 'finished' && processingList.contains(uuid)) {
        processingList = processingList.filter(o => o !== uuid);
        list = list.filter(o => o !== uuid);
        finishedList = finishedList.push(uuid);
        return state
          .setIn(['swaps', 'list'], list)
          .setIn(['swaps', 'processingList'], processingList)
          .setIn(['swaps', 'finishedList'], finishedList)
          .setIn(['swaps', 'entities'], entities)
          .setIn(['swaps', 'loading'], false);
      }
      return (
        state
          // .setIn(['swaps', 'list'], list)
          .setIn(['swaps', 'entities'], entities)
          .setIn(['swaps', 'loading'], true)
      );
    },

    [LOAD_RECENT_SWAPS_DATA_FROM_WEBSOCKET]: (state, { payload }) => {
      const { uuid, expiration, method, update, status, sentflags } = payload;
      const list = state.getIn(['swaps', 'list']);

      // step one: find entity
      let entities = state.getIn(['swaps', 'entities']);
      let entity = entities.get(uuid);
      if (entity && entity.get('status') === 'finished') {
        // NOTE: stop update when a swap was finished
        return state;
      }

      // step two: update expiration
      if (expiration) {
        entity = entity.set('expiration', expiration);
      }

      // step three: update sentflags
      if (method === 'update') {
        let sentf = entity.get('sentflags');
        if (!sentf.includes(update)) {
          sentf = sentf.unshift(update);
          entity = entity.set('sentflags', sentf);
        }
      }

      if (method === 'tradestatus') {
        entity = entity.set('sentflags', fromJS(sentflags));
      }

      // step four: update status
      if (method === 'tradestatus') {
        entity = entity.set('status', status);
      }

      entities = entities.set(uuid, entity);

      if (status === 'finished' && list.get(0) === uuid) {
        return (
          state
            // .setIn(['swaps', 'list'], list)
            .setIn(['swaps', 'entities'], entities)
            .setIn(['swaps', 'loading'], false)
        );
      }
      return (
        state
          // .setIn(['swaps', 'list'], list)
          .setIn(['swaps', 'entities'], entities)
          .setIn(['swaps', 'loading'], true)
      );
    },

    [LOAD_RECENT_SWAPS_ERROR]: (state, { error }) =>
      state.setIn(['swaps', 'error'], error).setIn(['swaps', 'loading'], false),

    [REMOVE_SWAPS_DATA]: state =>
      state
        .setIn(['swaps', 'list'], fromJS([]))
        // .setIn(['swaps', 'entities'], fromJS({}))
        .setIn(['swaps', 'error'], false)
        .setIn(['swaps', 'loading'], false)
        .setIn(['buying', 'error'], false)
        .setIn(['buying', 'loading'], false),

    [SWAP_TIMEOUT]: (state, { payload }) => {
      // NOTE: Todo
      // notification to user
      const { uuid } = payload;
      // step one: get data
      let list = state.getIn(['swaps', 'list']);
      let processingList = state.getIn(['swaps', 'processingList']);
      // step two: remove swap from processingList
      processingList = processingList.filter(o => o !== uuid);
      list = list.filter(o => o !== uuid);

      return state
        .setIn(['swaps', 'list'], list)
        .setIn(['swaps', 'processingList'], processingList);
    },

    [LOGOUT]: () => initialState
  },
  initialState
);

export default buyReducer;
/* eslint-enable no-case-declarations, no-param-reassign */
