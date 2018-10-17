// @flow
import React from 'react';
import type { Node } from 'react';
// import ClassNames from 'classnames';
import { shell } from 'electron';
import { connect } from 'react-redux';
import { compose } from 'redux';
import type { Dispatch } from 'redux';
import type { Map } from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import { createStructuredSelector } from 'reselect';
import Grid from '@material-ui/core/Grid';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Divider from '@material-ui/core/Divider';
import CloudOff from '@material-ui/icons/CloudOff';

import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import explorer from '../../lib/explorer';
// eslint-disable-next-line import/named
import { formatDate } from '../../lib/date-format';
import { getCoinIcon } from '../../components/CryptoIcons';
import { STATE_SWAPS, SWAP_TX_DEFAULT } from './constants';
import { closeDetailModal } from './actions';
import {
  makeSelectSwapDetailModal,
  makeSelectSwapInDetailModal
} from './selectors';
import CoinSelectable from './components/CoinSelectable';
import BuyButton from './components/BuyButton';

const debug = require('debug')('dicoapp:containers:BuyPage:SwapDetailModal');

type Props = {
  // eslint-disable-next-line flowtype/no-weak-types
  classes: Object,
  // eslint-disable-next-line flowtype/no-weak-types
  onClose: Function,
  // eslint-disable-next-line flowtype/no-weak-types
  detailModal: Map<*, *>,
  // eslint-disable-next-line flowtype/no-weak-types
  swap: Map<*, *>
};

const styles = theme => ({
  swapDetail__content: {
    width: 500,
    textAlign: 'center'
  },

  amountform: {
    width: '50%'
  },

  amountform__item: {
    width: '100%'
  },

  amountform__itemCenter: {
    textAlign: 'center'
  },

  amountform__switchBtn: {
    position: 'absolute',
    textAlign: 'center',
    // top: '20%',
    top: 90,
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 25,
    width: 100
  },

  swapform_button: {
    margin: '0 auto'
  },

  swapDetail__container: {
    position: 'relative'
  },

  swapDetail__listitem: {
    paddingLeft: 0,
    paddingRight: 0
  },

  swapDetail__divider: {
    width: '35%',
    margin: '0 auto'
  },

  swapDetail__success: {
    color: theme.colors.success
  },

  swapDetail__danger: {
    color: theme.colors.danger
  },

  swapform__iconemptystate: {
    fontSize: 50
  },

  swapform__emptystate: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 25
  },

  swapform__uppercase: {
    textTransform: 'uppercase'
  },

  amountform__uuidlink: {
    textDecoration: 'none',
    color: theme.palette.primary.main,
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: '1.375em'
  },

  swapDetail__ListItemRight: {
    top: 12,
    transform: 'none'
  }
});

export class SwapDetail extends React.PureComponent<Props> {
  renderNotFound = () => {
    const { classes } = this.props;
    return (
      <div className={classes.swapform__emptystate}>
        <Typography variant="title" gutterBottom>
          <CloudOff className={classes.swapform__iconemptystate} />
        </Typography>
        <Typography variant="subheading" gutterBottom>
          No data found. Please start making a swap.
        </Typography>
      </div>
    );
  };

  openExplorer = (evt: SyntheticInputEvent<>) => {
    evt.preventDefault();
    // https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
    shell.openExternal(evt.target.href);
  };

  renderTXLink = (title: string, value, link: string | Node) => {
    const { classes } = this.props;
    return (
      <ListItem className={classes.swapDetail__listitem}>
        <ListItemText
          primary={
            <Typography variant="caption" gutterBottom>
              {title}
            </Typography>
          }
          secondary={link}
        />
        <ListItemSecondaryAction className={classes.swapDetail__ListItemRight}>
          <Typography variant="caption" gutterBottom>
            {value}
          </Typography>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  renderMyFee = () => {
    const { swap, classes } = this.props;
    const value = swap.getIn(['myfee', 'value']);
    const tx = swap.getIn(['myfee', 'tx']);
    const coin = swap.get('alice');
    let link = (
      <Typography variant="caption" gutterBottom>
        Open TX in block explorer
      </Typography>
    );
    if (tx !== SWAP_TX_DEFAULT) {
      link = (
        <a
          href={explorer(tx, coin)}
          onClick={this.openExplorer}
          className={classes.amountform__uuidlink}
        >
          Open TX in block explorer
        </a>
      );
    }
    return this.renderTXLink('MY FEE', value, link);
  };

  renderBobDeposit = () => {
    const { swap, classes } = this.props;
    const value = swap.getIn(['bobdeposit', 'value']);
    const tx = swap.getIn(['bobdeposit', 'tx']);
    const coin = swap.get('bob');
    let link = (
      <Typography variant="caption" gutterBottom>
        Open TX in block explorer
      </Typography>
    );
    if (tx !== SWAP_TX_DEFAULT) {
      link = (
        <a
          href={explorer(tx, coin)}
          onClick={this.openExplorer}
          className={classes.amountform__uuidlink}
        >
          Open TX in block explorer
        </a>
      );
    }
    return this.renderTXLink('BOB DEPOSIT', value, link);
  };

  renderAlicepayment = () => {
    const { swap, classes } = this.props;
    const value = swap.getIn(['alicepayment', 'value']);
    const tx = swap.getIn(['alicepayment', 'tx']);
    const coin = swap.get('alice');
    let link = (
      <Typography variant="caption" gutterBottom>
        Open TX in block explorer
      </Typography>
    );
    if (tx !== SWAP_TX_DEFAULT) {
      link = (
        <a
          href={explorer(tx, coin)}
          onClick={this.openExplorer}
          className={classes.amountform__uuidlink}
        >
          Open TX in block explorer
        </a>
      );
    }
    return this.renderTXLink('ALICE PAYMENT', value, link);
  };

  renderBobpayment = () => {
    const { swap, classes } = this.props;
    const value = swap.getIn(['bobpayment', 'value']);
    const tx = swap.getIn(['bobpayment', 'tx']);
    const coin = swap.get('bob');
    let link = (
      <Typography variant="caption" gutterBottom>
        Open TX in block explorer
      </Typography>
    );
    if (tx !== SWAP_TX_DEFAULT) {
      link = (
        <a
          href={explorer(tx, coin)}
          onClick={this.openExplorer}
          className={classes.amountform__uuidlink}
        >
          Open TX in block explorer
        </a>
      );
    }
    return this.renderTXLink('BOB PAYMENT', value, link);
  };

  renderAlicespend = () => {
    const { swap, classes } = this.props;
    const value = swap.getIn(['alicespend', 'value']);
    const tx = swap.getIn(['alicespend', 'tx']);
    const coin = swap.get('bob');
    let link = (
      <Typography variant="caption" gutterBottom>
        Open TX in block explorer
      </Typography>
    );
    if (tx !== SWAP_TX_DEFAULT) {
      link = (
        <a
          href={explorer(tx, coin)}
          onClick={this.openExplorer}
          className={classes.amountform__uuidlink}
        >
          Open TX in block explorer
        </a>
      );
    }
    return this.renderTXLink('ALICE SPEND', value, link);
  };

  renderSwap = () => {
    const { swap, classes, onClose } = this.props;
    return (
      <React.Fragment>
        <CardHeader
          title={
            <Typography variant="title" gutterBottom>
              Detail Swap
            </Typography>
          }
          subheader={
            <Typography variant="caption" gutterBottom>
              {swap.get('uuid')}
            </Typography>
          }
        />
        <CardContent>
          <Grid
            container
            spacing={24}
            className={classes.swapDetail__container}
          >
            <Grid item xs={6} className={classes.amountform__itemCenter}>
              <CoinSelectable
                className={classes.swapform_button}
                icon={getCoinIcon(swap.get('alice'))}
                title="Deposit"
                subTitle={
                  <span className={classes.swapDetail__danger}>
                    {swap.get('aliceamount')} {swap.get('alice')}
                  </span>
                }
              />
            </Grid>
            <SwapHorizIcon className={classes.amountform__switchBtn} />
            <Grid item xs={6} className={classes.amountform__itemCenter}>
              <CoinSelectable
                className={classes.swapform_button}
                icon={getCoinIcon(swap.get('bob'))}
                title="Receive"
                subTitle={
                  <span className={classes.swapDetail__success}>
                    {swap.get('bobamount')} {swap.get('bob')}
                  </span>
                }
              />
            </Grid>
            <Grid item xs={12} className={classes.amountform__itemCenter}>
              <Typography variant="body2" gutterBottom>
                Step {swap.get('sentflags').size + 1}
                /6: {STATE_SWAPS[swap.get('sentflags').size]}
              </Typography>
              <LinearProgress
                color="primary"
                variant="determinate"
                value={swap.get('sentflags').size * 20}
              />
            </Grid>
            <Grid item xs={12} className={classes.amountform__itemCenter}>
              <List>
                <ListItem className={classes.swapDetail__listitem}>
                  <ListItemText
                    primary={
                      <Typography variant="caption" gutterBottom>
                        DATE
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction
                    className={classes.swapDetail__ListItemRight}
                  >
                    <Typography variant="caption" gutterBottom>
                      {formatDate(
                        swap.get('expiration') * 1000,
                        'yyyy-MM-dd HH:mm:ss'
                      )}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem className={classes.swapDetail__listitem}>
                  <ListItemText
                    primary={
                      <Typography variant="caption" gutterBottom>
                        TO
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider className={classes.swapDetail__divider} />
                {this.renderMyFee()}
                {this.renderBobDeposit()}
                {this.renderAlicepayment()}
                {this.renderBobpayment()}
                {this.renderAlicespend()}
                <Divider className={classes.swapDetail__divider} />
                <ListItem className={classes.swapDetail__listitem}>
                  <ListItemText
                    primary={
                      <Typography
                        variant="caption"
                        gutterBottom
                        className={classes.swapform__uppercase}
                      >
                        Status
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography
                      variant="caption"
                      gutterBottom
                      className={classes.swapform__uppercase}
                    >
                      {swap.get('status')}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Grid>
            <BuyButton
              color="primary"
              variant="contained"
              className={classes.amountform__item}
              onClick={onClose}
            >
              Close
            </BuyButton>
          </Grid>
        </CardContent>
      </React.Fragment>
    );
  };

  render() {
    debug('render');
    const { swap, classes, detailModal, onClose } = this.props;
    return (
      <SwipeableDrawer
        anchor="right"
        open={detailModal.get('open')}
        onClose={onClose}
      >
        <div tabIndex={0} role="button" className={classes.swapDetail__content}>
          {!swap && this.renderNotFound()}
          {swap && this.renderSwap()}
        </div>
      </SwipeableDrawer>
    );
  }
}

// eslint-disable-next-line flowtype/no-weak-types
export function mapDispatchToProps(dispatch: Dispatch<Object>) {
  return {
    onClose: () => dispatch(closeDetailModal())
  };
}

const mapStateToProps = createStructuredSelector({
  detailModal: makeSelectSwapDetailModal(),
  swap: makeSelectSwapInDetailModal()
});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps
);

const SwapDetailWapper = compose(
  withConnect,
  withStyles(styles)
)(SwapDetail);

export default SwapDetailWapper;
