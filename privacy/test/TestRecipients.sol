// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RejectingRecipient {
    receive() external payable { revert("reject"); }
}

contract ReenteringRecipient {
    address public pool;
    bytes public payload;
    bool public reentrySucceeded;
    function configure(address target, bytes calldata callData) external { pool = target; payload = callData; }
    receive() external payable { (reentrySucceeded,) = pool.call{value: msg.value}(payload); }
}
