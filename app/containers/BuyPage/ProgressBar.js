// @flow
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { makeSelectBalanceLoading } from '../App/selectors';
import { makeSelectPricesLoading } from './selectors';

const debug = require('debug')('dicoapp:containers:BuyPage:ProgressBar');

const styles = theme => ({
  linearprogress: {
    zIndex: theme.zIndex.drawer + 10,
    height: 3,
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0
  }
});

type Props = {
  // eslint-disable-next-line flowtype/no-weak-types
  classes: Object,
  balanceLoading: boolean,
  priceLoading: boolean
};

export class ProgressBar extends PureComponent<Props> {
  props: Props;

  render() {
    debug('render');

    const { classes, balanceLoading, priceLoading } = this.props;
    if (balanceLoading || priceLoading) {
      return <LinearProgress className={classes.linearprogress} />;
    }
    return null;
  }
}

const mapStateToProps = createStructuredSelector({
  priceLoading: makeSelectPricesLoading(),
  balanceLoading: makeSelectBalanceLoading()
});

const withConnect = connect(
  mapStateToProps,
  null
);

const ProgressBarWapper = compose(
  withConnect,
  withStyles(styles)
)(ProgressBar);

export default ProgressBarWapper;
