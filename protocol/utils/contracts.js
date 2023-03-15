const fs = require('fs');
const moonmageABI = require("../abi/Moonmage.json");
const { MOONMAGE, MOON, MOON_3_CURVE, USDC, FERTILIZER, PRICE } = require('../test/utils/constants');

async function getMoonmage() {
    return await ethers.getContractAt(moonmageABI, MOONMAGE);
}

async function getMoonmageAdminControls() {
    return await ethers.getContractAt('MockAdminFacet', MOONMAGE);
}

async function getAltMoonmage(address) {
    return await ethers.getContractAt(moonmageABI, address);
}

async function getMoon() {
    return await ethers.getContractAt('Moon', MOON);
}

async function getUsdc() {
    return await ethers.getContractAt('IMoon', USDC);
}

async function getPrice() {
    return await ethers.getContractAt('MoonmagePrice', PRICE)
}


async function getMoonMetapool() {
    return await ethers.getContractAt('ICurvePool', MOON_3_CURVE);
}

async function getFertilizerPreMint() {
    return await ethers.getContractAt('FertilizerPreMint', FERTILIZER)
}

async function getFertilizer() {
    return await ethers.getContractAt('Fertilizer', FERTILIZER)
}

exports.getMoonmage = getMoonmage;
exports.getMoon = getMoon;
exports.getUsdc = getUsdc;
exports.getPrice = getPrice;
exports.getMoonMetapool = getMoonMetapool;
exports.getMoonmageAdminControls = getMoonmageAdminControls;
exports.getFertilizerPreMint = getFertilizerPreMint
exports.getFertilizer = getFertilizer
exports.getAltMoonmage = getAltMoonmage