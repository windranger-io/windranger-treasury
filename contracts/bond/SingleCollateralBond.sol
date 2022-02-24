// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface SingleCollateralBond {
    /**
     * @notice Transitions the Bond state, from being non-redeemable (accepting deposits and slashing) to
     *          redeemable (accepting redeem and withdraw collateral).
     *
     * @dev Debt tokens are not allowed to be redeemed before the owner grants permission.
     */
    function allowRedemption(string calldata reason) external;

    /**
     * @notice Deposit swaps collateral tokens for an equal amount of debt tokens.
     *
     * @dev Before the deposit can be made, this contract must have been approved to transfer the given amount
     * from the ERC20 token being used as collateral.
     *
     * @param amount The number of collateral token to transfer from the _msgSender().
     *          Must be in the range of one to the number of debt tokens available for swapping.
     *          The _msgSender() receives the debt tokens.
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Pauses most side affecting functions.
     *
     * @dev The ony side effecting (non view or pure function) function exempt from pausing is expire().
     */
    function pause() external;

    /**
     * @notice Redeem swaps debt tokens for collateral tokens.
     *
     * @dev Converts the amount of debt tokens owned by the sender, at the exchange ratio determined by the remaining
     *  amount of collateral against the remaining amount of debt.
     *  There are operations that reduce the held collateral, while the debt remains constant.
     *
     * @param amount The number of debt token to transfer from the _msgSender().
     *          Must be in the range of one to the number of debt tokens available for swapping.
     *          The _msgSender() receives the redeemed collateral tokens.
     */
    function redeem(uint256 amount) external;

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external;

    /**
     * @notice Enact a penalty for guarantors, a loss of a portion of their bonded collateral.
     *          The designated Treasury is the recipient for the slashed collateral.
     *
     * @dev The penalty can range between one and all of the collateral.
     *
     * As the amount of debt tokens remains the same. Slashing reduces the collateral tokens, so each debt token
     * is redeemable for less collateral, altering the redemption ratio calculated on allowRedemption().
     *
     * @param amount The number of bonded collateral token to transfer from the Bond to the Treasury.
     *          Must be in the range of one to the number of collateral tokens held by the Bond.
     */
    function slash(uint256 amount, string calldata reason) external;

    /**
     * @notice Replaces any stored metadata.
     *
     * @dev As metadata is not pertinent for Bond operations, this may be anything, such as a delimitated string.
     *
     * @param data Information useful for off-chain actions e.g. performance factor, assessment date, rewards pool.
     */
    function setMetaData(string calldata data) external;

    /**
     * Permits the owner to update the Treasury address.
     *
     * @dev treasury is the recipient of slashed, expired or withdrawn collateral.
     *          Must be a non-zero address.
     *
     * @param replacement Treasury recipient for future operations. Must not be zero address.
     */
    function setTreasury(address replacement) external;

    /**
 * @notice Permits the owner to transfer all collateral held by the Bond to the Treasury.
     *
     * @dev Intention is to sweeping up excess collateral from redemption ration calculation.
     *         when there has been slashing. Slashing can result in collateral remaining due to flooring.

     *  Can also provide an emergency extracting moving of funds out of the Bond by the owner.
     */
    function withdrawCollateral() external;
}
