'use strict';
// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                  enumerable: true,
                  get: function() {
                      return m[k];
                  },
              });
          }
        : function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function(o, v) {
              Object.defineProperty(o, 'default', {
                  enumerable: true,
                  value: v,
              });
          }
        : function(o, v) {
              o['default'] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== 'default' && Object.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports._calculateDueTokenProtocolSwapFee = exports._bptInForExactTokenOut = exports._bptInForExactTokensOut = exports._exactBPTInForTokensOut = exports._exactBPTInForTokenOut = exports._tokenInForExactBPTOut = exports._exactTokenInForBPTOut = exports._exactTokensInForBPTOut = exports._invariant = exports._inGivenOut = exports._outGivenIn = void 0;
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// This is ported to JS from solidity
// https://github.com/balancer-labs/balancer-core-v2/blob/master/contracts/pools/weighted/WeightedMath.sol
// with the following edits:
// * The swap fee is added to the swap functions (the fees are charged outside in the solidity code)
// * Added _exactTokenInForBptOut and _bptInForExactTokenOut for convenience
// import { BigNumber } from '../../../utils/bignumber';
const FixedPoint_1 = require('../math/FixedPoint');
const FixedPoint = __importStar(require('../math/FixedPoint'));
// This is a contract to emulate file-level functions. Convert to a library
// after the migration to solc v0.7.1.
/* solhint-disable private-vars-leading-underscore */
// Computes how many tokens can be taken out of a pool if `tokenAmountIn` are sent, given the
// current balances and weights.
function _outGivenIn(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountIn,
    swapFee
) {
    /**********************************************************************************************
    // outGivenIn                                                                                //
    // aO = tokenAmountOut                                                                       //
    // bO = tokenBalanceOut                                                                      //
    // bI = tokenBalanceIn              /      /            bI             \    (wI / wO) \      //
    // aI = tokenAmountIn    aO = bO * |  1 - | --------------------------  | ^            |     //
    // wI = tokenWeightIn               \      \       ( bI + aI )         /              /      //
    // wO = tokenWeightOut                                                                       //
    **********************************************************************************************/
    // Amount out, so we round down overall.
    // The multiplication rounds down, and the subtrahend (power) rounds up (so the base rounds up too).
    // Because bI / (bI + aI) <= 1, the exponent rounds down.
    // Added fee which was not in original code
    tokenBalanceIn = tokenBalanceIn.mulDown(swapFee.complement());
    let newBalance = tokenBalanceIn.add(tokenAmountIn);
    let base = tokenBalanceIn.divUp(newBalance);
    let exponent = tokenWeightIn.divDown(tokenWeightOut);
    let power = FixedPoint.powUp(base, exponent);
    return tokenBalanceOut.mulDown(power.complement());
}
exports._outGivenIn = _outGivenIn;
// Computes how many tokens must be sent to a pool in order to take `tokenAmountOut`, given the
// current balances and weights.
function _inGivenOut(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    tokenAmountOut,
    swapFee
) {
    /**********************************************************************************************
    // inGivenOut                                                                                //
    // aO = tokenAmountOut                                                                       //
    // bO = tokenBalanceOut                                                                      //
    // bI = tokenBalanceIn              /  /            bO             \    (wO / wI)      \     //
    // aI = tokenAmountIn    aI = bI * |  | --------------------------  | ^            - 1  |    //
    // wI = tokenWeightIn               \  \       ( bO - aO )         /                   /     //
    // wO = tokenWeightOut                                                                       //
    **********************************************************************************************/
    // Amount in, so we round up overall.
    // The multiplication rounds up, and the power rounds up (so the base rounds up too).
    // Because b0 / (b0 - a0) >= 1, the exponent rounds up.
    let base = tokenBalanceOut.divUp(tokenBalanceOut.sub(tokenAmountOut));
    let exponent = tokenWeightOut.divUp(tokenWeightIn);
    let power = FixedPoint.powUp(base, exponent);
    let ratio = power.sub(FixedPoint.ONE);
    // return tokenBalanceIn.mulUp(ratio); // Original code
    return tokenBalanceIn.mulUp(ratio).divUp(swapFee.complement());
}
exports._inGivenOut = _inGivenOut;
function _invariant(normalizedWeights, balances) {
    /**********************************************************************************************
    // invariant               _____                                                             //
    // wi = weight index i      | |      wi                                                      //
    // bi = balance index i     | |  bi ^   = i                                                  //
    // i = invariant                                                                             //
    **********************************************************************************************/
    let invariant = FixedPoint.ONE;
    for (let i = 0; i < normalizedWeights.length; i++) {
        invariant = invariant.mul(
            FixedPoint.pow(balances[i], normalizedWeights[i])
        );
    }
    return invariant;
}
exports._invariant = _invariant;
function _exactTokensInForBPTOut(
    balances,
    normalizedWeights,
    amountsIn,
    bptTotalSupply,
    swapFee
) {
    // BPT out, so we round down overall.
    // First loop to calculate the weighted balance ratio
    // The increment `amountIn` represents for each token, as a quotient of new and current balances: BigNumber,
    // not accounting swap fees
    let tokenBalanceRatiosWithoutFee = new Array(amountsIn.length);
    // The weighted sum of token balance rations sans fee
    let weightedBalanceRatio = FixedPoint_1.bnum(0);
    for (let i = 0; i < balances.length; i++) {
        tokenBalanceRatiosWithoutFee[i] = balances[i]
            .add(amountsIn[i])
            .divDown(balances[i]);
        weightedBalanceRatio = weightedBalanceRatio.add(
            tokenBalanceRatiosWithoutFee[i].mulDown(normalizedWeights[i])
        );
    }
    //Second loop to calculate new amounts in taking into account the fee on the % excess
    // The growth of the invariant caused by the join, as a quotient of the new value and the current one
    let invariantRatio = FixedPoint.ONE;
    for (let i = 0; i < balances.length; i++) {
        // Percentage of the amount supplied that will be swapped for other tokens in the pool
        let tokenBalancePercentageExcess;
        // Some tokens might have amounts supplied in excess of a 'balanced' join: these are identified if
        // the token's balance ratio sans fee is larger than the weighted balance ratio, and swap fees charged
        // on the amount to swap
        if (weightedBalanceRatio >= tokenBalanceRatiosWithoutFee[i]) {
            tokenBalancePercentageExcess = FixedPoint_1.bnum(0);
        } else {
            tokenBalancePercentageExcess = tokenBalanceRatiosWithoutFee[i]
                .sub(weightedBalanceRatio)
                .divUp(tokenBalanceRatiosWithoutFee[i].sub(FixedPoint.ONE));
        }
        let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
        let amountInAfterFee = amountsIn[i].mulDown(swapFeeExcess.complement());
        let tokenBalanceRatio = FixedPoint.ONE.add(
            amountInAfterFee.divDown(balances[i])
        );
        invariantRatio = invariantRatio.mulDown(
            FixedPoint.powDown(tokenBalanceRatio, normalizedWeights[i])
        );
    }
    return bptTotalSupply.mulDown(invariantRatio.sub(FixedPoint.ONE));
}
exports._exactTokensInForBPTOut = _exactTokensInForBPTOut;
// This function was added for convenience (adapted from _exactTokensInForBPTOut above)
function _exactTokenInForBPTOut(
    balance,
    normalizedWeight,
    amountIn,
    bptTotalSupply,
    swapFee
) {
    // BPT out, so we round down overall.
    let tokenBalanceRatioWithoutFee;
    // The weighted sum of token balance rations sans fee
    let weightedBalanceRatio = FixedPoint_1.bnum(0);
    tokenBalanceRatioWithoutFee = balance.add(amountIn).divDown(balance);
    weightedBalanceRatio = weightedBalanceRatio.add(
        tokenBalanceRatioWithoutFee.mulDown(normalizedWeight)
    );
    let invariantRatio = FixedPoint.ONE;
    // Percentage of the amount supplied that will be swapped for other tokens in the pool
    let tokenBalancePercentageExcess;
    // Some tokens might have amounts supplied in excess of a 'balanced' join: these are identified if
    // the token's balance ratio sans fee is larger than the weighted balance ratio, and swap fees charged
    // on the amount to swap
    if (weightedBalanceRatio >= tokenBalanceRatioWithoutFee) {
        tokenBalancePercentageExcess = FixedPoint_1.bnum(0);
    } else {
        tokenBalancePercentageExcess = tokenBalanceRatioWithoutFee
            .sub(weightedBalanceRatio)
            .divUp(tokenBalanceRatioWithoutFee.sub(FixedPoint.ONE));
    }
    let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
    let amountInAfterFee = amountIn.mulDown(swapFeeExcess.complement());
    let tokenBalanceRatio = FixedPoint.ONE.add(
        amountInAfterFee.divDown(balance)
    );
    invariantRatio = invariantRatio.mulDown(
        FixedPoint.powDown(tokenBalanceRatio, normalizedWeight)
    );
    return bptTotalSupply.mulDown(invariantRatio.sub(FixedPoint.ONE));
}
exports._exactTokenInForBPTOut = _exactTokenInForBPTOut;
function _tokenInForExactBPTOut(
    tokenBalance,
    tokenNormalizedWeight,
    bptAmountOut,
    bptTotalSupply,
    swapFee
) {
    /******************************************************************************************
    // tokenInForExactBPTOut                                                                 //
    // a = tokenAmountIn                                                                     //
    // b = tokenBalance                 /  /    totalBPT + bptOut      \    (1 / w)       \  //
    // bptOut = bptAmountOut   a = b * |  | --------------------------  | ^          - 1  |  //
    // bpt = totalBPT                   \  \       totalBPT            /                  /  //
    // w = tokenWeight                                                                       //
    ******************************************************************************************/
    // Token in, so we round up overall.
    // Calculate the factor by which the invariant will increase after minting BPTAmountOut
    let invariantRatio = bptTotalSupply.add(bptAmountOut).divUp(bptTotalSupply);
    // Calculate by how much the token balance has to increase to cause invariantRatio
    let tokenBalanceRatio = FixedPoint.powUp(
        invariantRatio,
        FixedPoint.ONE.divUp(tokenNormalizedWeight)
    );
    let tokenBalancePercentageExcess = tokenNormalizedWeight.complement();
    let amountInAfterFee = tokenBalance.mulUp(
        tokenBalanceRatio.sub(FixedPoint.ONE)
    );
    let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
    return amountInAfterFee.divUp(swapFeeExcess.complement());
}
exports._tokenInForExactBPTOut = _tokenInForExactBPTOut;
function _exactBPTInForTokenOut(
    tokenBalance,
    tokenNormalizedWeight,
    bptAmountIn,
    bptTotalSupply,
    swapFee
) {
    /*****************************************************************************************
    // exactBPTInForTokenOut                                                                //
    // a = tokenAmountOut                                                                   //
    // b = tokenBalance                /      /    totalBPT - bptIn       \    (1 / w)  \   //
    // bptIn = bptAmountIn    a = b * |  1 - | --------------------------  | ^           |  //
    // bpt = totalBPT                  \      \       totalBPT            /             /   //
    // w = tokenWeight                                                                      //
    *****************************************************************************************/
    // Token out, so we round down overall.
    // Calculate the factor by which the invariant will decrease after burning BPTAmountIn
    let invariantRatio = bptTotalSupply.sub(bptAmountIn).divUp(bptTotalSupply);
    // Calculate by how much the token balance has to increase to cause invariantRatio
    let tokenBalanceRatio = FixedPoint.powUp(
        invariantRatio,
        FixedPoint.ONE.divUp(tokenNormalizedWeight)
    );
    let tokenBalancePercentageExcess = tokenNormalizedWeight.complement();
    //Because of rounding up, tokenBalanceRatio can be greater than one
    let amountOutBeforeFee = tokenBalance.mulDown(
        tokenBalanceRatio.complement()
    );
    let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
    return amountOutBeforeFee.mulDown(swapFeeExcess.complement());
}
exports._exactBPTInForTokenOut = _exactBPTInForTokenOut;
function _exactBPTInForTokensOut(currentBalances, bptAmountIn, totalBPT) {
    /**********************************************************************************************
    // exactBPTInForAllTokensOut                                                                 //
    // (per token)                                                                               //
    // aO = tokenAmountOut             /        bptIn         \                                  //
    // b = tokenBalance      a0 = b * | ---------------------  |                                 //
    // bptIn = bptAmountIn             \       totalBPT       /                                  //
    // bpt = totalBPT                                                                            //
    **********************************************************************************************/
    // Since we're computing an amount out, we round down overall. This means rounding down on both the
    // multiplication and division.
    let bptRatio = bptAmountIn.divDown(totalBPT);
    let amountsOut = new Array(currentBalances.length);
    for (let i = 0; i < currentBalances.length; i++) {
        amountsOut[i] = currentBalances[i].mulDown(bptRatio);
    }
    return amountsOut;
}
exports._exactBPTInForTokensOut = _exactBPTInForTokensOut;
function _bptInForExactTokensOut(
    balances,
    normalizedWeights,
    amountsOut,
    bptTotalSupply,
    swapFee
) {
    // BPT in, so we round up overall.
    // First loop to calculate the weighted balance ratio
    let tokenBalanceRatiosWithoutFee = new Array(amountsOut.length);
    let weightedBalanceRatio = FixedPoint_1.bnum(0);
    for (let i = 0; i < balances.length; i++) {
        tokenBalanceRatiosWithoutFee[i] = balances[i]
            .sub(amountsOut[i])
            .divUp(balances[i]);
        weightedBalanceRatio = weightedBalanceRatio.add(
            tokenBalanceRatiosWithoutFee[i].mulUp(normalizedWeights[i])
        );
    }
    //Second loop to calculate new amounts in taking into account the fee on the % excess
    let invariantRatio = FixedPoint.ONE;
    for (let i = 0; i < balances.length; i++) {
        let tokenBalancePercentageExcess;
        let tokenBalanceRatio;
        // For each ratioSansFee, compare with the total weighted ratio (weightedBalanceRatio) and
        // decrease the fee from what goes above it
        if (weightedBalanceRatio <= tokenBalanceRatiosWithoutFee[i]) {
            tokenBalancePercentageExcess = FixedPoint_1.bnum(0);
        } else {
            tokenBalancePercentageExcess = weightedBalanceRatio
                .sub(tokenBalanceRatiosWithoutFee[i])
                .divUp(tokenBalanceRatiosWithoutFee[i].complement());
        }
        let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
        let amountOutBeforeFee = amountsOut[i].divUp(
            swapFeeExcess.complement()
        );
        tokenBalanceRatio = amountOutBeforeFee.divUp(balances[i]).complement();
        invariantRatio = invariantRatio.mulDown(
            FixedPoint.powDown(tokenBalanceRatio, normalizedWeights[i])
        );
    }
    return bptTotalSupply.mulUp(invariantRatio.complement());
}
exports._bptInForExactTokensOut = _bptInForExactTokensOut;
// This function was added for convinience based on _bptInForExactTokensOut above
function _bptInForExactTokenOut(
    balance,
    normalizedWeight,
    amountOut,
    bptTotalSupply,
    swapFee
) {
    // BPT in, so we round up overall.
    let tokenBalanceRatioWithoutFee;
    let weightedBalanceRatio = FixedPoint_1.bnum(0);
    tokenBalanceRatioWithoutFee = balance.sub(amountOut).divUp(balance);
    weightedBalanceRatio = weightedBalanceRatio.add(
        tokenBalanceRatioWithoutFee.mulUp(normalizedWeight)
    );
    let invariantRatio = FixedPoint.ONE;
    let tokenBalancePercentageExcess;
    let tokenBalanceRatio;
    // For each ratioSansFee, compare with the total weighted ratio (weightedBalanceRatio) and
    // decrease the fee from what goes above it
    if (weightedBalanceRatio <= tokenBalanceRatioWithoutFee) {
        tokenBalancePercentageExcess = FixedPoint_1.bnum(0);
    } else {
        tokenBalancePercentageExcess = weightedBalanceRatio
            .sub(tokenBalanceRatioWithoutFee)
            .divUp(tokenBalanceRatioWithoutFee.complement());
    }
    let swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
    let amountOutBeforeFee = amountOut.divUp(swapFeeExcess.complement());
    tokenBalanceRatio = amountOutBeforeFee.divUp(balance).complement();
    invariantRatio = invariantRatio.mulDown(
        FixedPoint.powDown(tokenBalanceRatio, normalizedWeight)
    );
    return bptTotalSupply.mulUp(invariantRatio.complement());
}
exports._bptInForExactTokenOut = _bptInForExactTokenOut;
function _calculateDueTokenProtocolSwapFee(
    balance,
    normalizedWeight,
    previousInvariant,
    currentInvariant,
    protocolSwapFeePercentage
) {
    /*********************************************************************************
    /*  protocolSwapFee * balanceToken * ( 1 - (previousInvariant / currentInvariant) ^ (1 / weightToken))
    *********************************************************************************/
    // We round down to prevent issues in the Pool's accounting, even if it means paying slightly less protocol fees
    // to the Vault.
    // Fee percentage and balance multiplications round down, while the subtrahend (power) rounds up (as does the
    // base). Because previousInvariant / currentInvariant <= 1, the exponent rounds down.
    if (currentInvariant.lt(previousInvariant)) {
        // This should never happen, but this acts as a safeguard to prevent the Pool from entering a locked state
        // in which joins and exits revert while computing accumulated swap fees.
        return FixedPoint_1.bnum(0);
    }
    let base = previousInvariant.divUp(currentInvariant);
    let exponent = FixedPoint.ONE.divDown(normalizedWeight);
    let power = FixedPoint.powUp(base, exponent);
    let tokenAccruedFees = balance.mulDown(power.complement());
    return tokenAccruedFees.mulDown(protocolSwapFeePercentage);
}
exports._calculateDueTokenProtocolSwapFee = _calculateDueTokenProtocolSwapFee;
