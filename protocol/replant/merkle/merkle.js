const { MerkleTree } = require('merkletreejs')
const csv = require('csv-parser');
const fs = require('fs');
const keccak256 = require("keccak256");
const ethers = require('ethers');

const moonsName = './replant/merkle/data/unripe-moons.csv'
const moonsOutput = './replant/merkle/data/unripe-moons-merkle.json'
const moonsItems = []
const moonsLeaves = []

fs.createReadStream(moonsName)
    .pipe(csv())
    .on('data', (row) => {
        const item = [row['address'], row['unripeMoons']];
        const leaf = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            item
        )
        moonsItems.push(item);
        moonsLeaves.push(leaf);
    })
    .on('end', () => {
        const merkleTree = new MerkleTree(moonsLeaves, keccak256, { sortPairs: true });
        const root = merkleTree.getHexRoot();
        const d = moonsItems.reduce((acc, [address, unripeMoons], i) => {
            acc[address] = {
                unripeMoons: unripeMoons,
                leaf: moonsLeaves[i],
                proof: merkleTree.getHexProof(moonsLeaves[i])
            }
            return acc;
        }, {})
        fs.writeFile(moonsOutput, JSON.stringify(d, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log(moonsOutput, "has been written with a root hash of:\n", root);
        });
    });

const moon3crvName = './replant/merkle/data/unripe-moon3crv.csv'
const moon3crvOutput = './replant/merkle/data/unripe-moon3crv-merkle.json'
const moon3crvItems = []
const moon3crvLeaves = []

fs.createReadStream(moon3crvName)
    .pipe(csv())
    .on('data', (row) => {
        const item = [row['address'], row['unripeMoon3crv']];
        const leaf = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            item
        )
        moon3crvItems.push(item);
        moon3crvLeaves.push(leaf);
    })
    .on('end', () => {
        const merkleTree = new MerkleTree(moon3crvLeaves, keccak256, { sortPairs: true });
        const root = merkleTree.getHexRoot();
        const d = moon3crvItems.reduce((acc, [address, unripeMoons], i) => {
            acc[address] = {
                unripeMoons: unripeMoons,
                leaf: moon3crvLeaves[i],
                proof: merkleTree.getHexProof(moon3crvLeaves[i])
            }
            return acc;
        }, {})
        fs.writeFile(moon3crvOutput, JSON.stringify(d, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log(moon3crvOutput, "has been written with a root hash of:\n", root);
        });
    });
