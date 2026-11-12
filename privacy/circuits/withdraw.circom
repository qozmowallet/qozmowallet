pragma circom 2.2.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

// Public signals follow declaration order: root, nullifierHash, domain, contextHash.
// Fixed denomination ETH pool. No amount confidentiality or private-to-private transfers.
template Withdraw(depth) {
    signal input root;
    signal input nullifierHash;
    signal input domain;
    signal input contextHash;
    signal input secret;
    signal input nullifier;
    signal input siblings[depth];
    signal input pathIndices[depth];
    signal input recipient;
    signal input relayer;
    signal input fee;

    component secretBits = Num2Bits(248);
    component nullifierBits = Num2Bits(248);
    secretBits.in <== secret;
    nullifierBits.in <== nullifier;
    signal secretInverse;
    signal nullifierInverse;
    secretInverse <-- 1 / secret;
    nullifierInverse <-- 1 / nullifier;
    secret * secretInverse === 1;
    nullifier * nullifierInverse === 1;

    component commitment = Poseidon(3);
    commitment.inputs[0] <== secret;
    commitment.inputs[1] <== nullifier;
    commitment.inputs[2] <== domain;
    component spent = Poseidon(2);
    spent.inputs[0] <== nullifier;
    spent.inputs[1] <== domain;
    spent.out === nullifierHash;

    signal nodes[depth + 1];
    signal left[depth];
    signal right[depth];
    component hashes[depth];
    nodes[0] <== commitment.out;
    for (var i = 0; i < depth; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0;
        left[i] <== nodes[i] + pathIndices[i] * (siblings[i] - nodes[i]);
        right[i] <== siblings[i] + pathIndices[i] * (nodes[i] - siblings[i]);
        hashes[i] = Poseidon(2);
        hashes[i].inputs[0] <== left[i];
        hashes[i].inputs[1] <== right[i];
        nodes[i + 1] <== hashes[i].out;
    }
    nodes[depth] === root;

    component context = Poseidon(4);
    context.inputs[0] <== recipient;
    context.inputs[1] <== relayer;
    context.inputs[2] <== fee;
    context.inputs[3] <== domain;
    context.out === contextHash;
}
component main {public [contextHash, root, nullifierHash, domain]} = Withdraw(8);
