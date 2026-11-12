// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPoseidon2 { function poseidon(uint256[2] calldata input) external view returns (uint256); }
interface IPoseidon4 { function poseidon(uint256[4] calldata input) external view returns (uint256); }
interface IWithdrawVerifier {
    function verifyProof(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[4] calldata signals) external view returns (bool);
}

/// @notice Unaudited Phase 1 research pool. Test networks only, fixed public denomination.
/// @dev No admin, upgrade, rescue, or verifier replacement. Local setup is NOT production safe.
contract QozmoPrivacyPool {
    uint256 public constant FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint32 public constant DEPTH = 8;
    uint256 public immutable denomination;
    uint256 public immutable domain;
    uint256 public immutable deploymentChainId;
    IPoseidon2 public immutable hasher;
    IPoseidon4 public immutable contextHasher;
    IWithdrawVerifier public immutable verifier;
    uint32 public nextIndex;
    uint256 public root;
    uint256[8] public zeros;
    uint256[8] private filled;
    // Bounded by the 256-deposit capacity; retain roots so a new deposit cannot invalidate a proof.
    mapping(uint256 => bool) public knownRoots;
    mapping(uint256 => bool) public commitments;
    mapping(uint256 => bool) public spentNullifiers;
    bool private entered;

    event Deposit(uint256 indexed commitment, uint32 leafIndex, uint256 root);
    event Withdrawal(uint256 indexed nullifierHash, address indexed recipient, address relayer, uint256 fee);
    error InvalidConfiguration();
    error InvalidDeposit();
    error InvalidWithdrawal();
    error InvalidProof();
    error PaymentFailed();
    error Reentrancy();

    modifier guarded() {
        if (entered) revert Reentrancy();
        entered = true;
        _;
        entered = false;
    }
    constructor(uint256 value, address poseidon2, address poseidon4, address proofVerifier) {
        if ((block.chainid != 31337 && block.chainid != 46630 && block.chainid != 11155111) || value == 0 || value >= FIELD || poseidon2.code.length == 0 || poseidon4.code.length == 0 || proofVerifier.code.length == 0) revert InvalidConfiguration();
        deploymentChainId = block.chainid;
        denomination = value;
        domain = uint256(keccak256(abi.encode("qozmo-privacy-v1", block.chainid, address(this), value))) % FIELD;
        hasher = IPoseidon2(poseidon2);
        contextHasher = IPoseidon4(poseidon4);
        verifier = IWithdrawVerifier(proofVerifier);
        uint256 zero;
        for (uint32 i = 0; i < DEPTH; i++) {
            zeros[i] = zero;
            filled[i] = zero;
            zero = hasher.poseidon([zero, zero]);
        }
        root = zero;
        // Empty tree is intentionally not a spendable root.
    }
    function deposit(uint256 commitment) external payable guarded {
        if (block.chainid != deploymentChainId || msg.value != denomination || commitment == 0 || commitment >= FIELD || commitments[commitment] || nextIndex >= 1 << DEPTH) revert InvalidDeposit();
        commitments[commitment] = true;
        uint32 index = nextIndex++;
        uint32 cursor = index;
        uint256 node = commitment;
        for (uint32 level = 0; level < DEPTH; level++) {
            if (cursor & 1 == 0) {
                filled[level] = node;
                node = hasher.poseidon([node, zeros[level]]);
            } else {
                node = hasher.poseidon([filled[level], node]);
            }
            cursor >>= 1;
        }
        root = node;
        knownRoots[node] = true;
        emit Deposit(commitment, index, node);
    }
    function withdraw(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256 spendRoot, uint256 nullifierHash, address payable recipient, address payable relayer, uint256 fee) external guarded {
        if (block.chainid != deploymentChainId || !knownRoots[spendRoot] || nullifierHash == 0 || nullifierHash >= FIELD || spentNullifiers[nullifierHash] || recipient == address(0) || recipient == address(this) || fee >= denomination || (fee > 0 && (relayer == address(0) || msg.sender != relayer))) revert InvalidWithdrawal();
        uint256 contextHash = contextHasher.poseidon([uint256(uint160(address(recipient))), uint256(uint160(address(relayer))), fee, domain]);
        if (!verifier.verifyProof(a, b, c, [spendRoot, nullifierHash, domain, contextHash])) revert InvalidProof();
        spentNullifiers[nullifierHash] = true;
        (bool sent,) = recipient.call{value: denomination - fee}("");
        if (!sent) revert PaymentFailed();
        if (fee > 0) {
            (sent,) = relayer.call{value: fee}("");
            if (!sent) revert PaymentFailed();
        }
        emit Withdrawal(nullifierHash, recipient, relayer, fee);
    }
}
