import { BigNumber } from '../../utils/bignumber';
export declare class FixedPoint extends BigNumber {
    constructor(number: any);
    add(b: FixedPoint): FixedPoint;
    sub(b: FixedPoint): FixedPoint;
    mul(b: FixedPoint): FixedPoint;
    mulDown(b: FixedPoint): FixedPoint;
    mulUp(b: FixedPoint): FixedPoint;
    divDown(b: FixedPoint): FixedPoint;
    divUp(b: FixedPoint): FixedPoint;
    powDown(x: FixedPoint, y: FixedPoint): FixedPoint;
    powUp(x: FixedPoint, y: FixedPoint): FixedPoint;
    /**
     * @dev Tells the complement of a given value capped to zero to avoid overflow
     */
    complement(): FixedPoint;
}
export declare const ONE: FixedPoint;
export declare const MAX_POW_RELATIVE_ERROR: FixedPoint;
export declare function bnum(val: string | number | BigNumber): FixedPoint;
export declare function add(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function sub(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function mul(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function mulDown(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function mulUp(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function div(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function divDown(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function divUp(a: FixedPoint, b: FixedPoint): FixedPoint;
export declare function pow(x: FixedPoint, y: FixedPoint): FixedPoint;
export declare function powDown(x: FixedPoint, y: FixedPoint): FixedPoint;
export declare function powUp(x: FixedPoint, y: FixedPoint): FixedPoint;
/**
 * @dev Tells the complement of a given value capped to zero to avoid overflow
 */
export declare function complement(x: FixedPoint): FixedPoint;
