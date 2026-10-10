import { Post, Rule } from "./types";

const h = (hoursAgo: number) => Date.now() - hoursAgo * 3600 * 1000;

export const rules: Rule[] = [
  { id: 1, author: "0xKickoff", name: "Fresh Off the Pitch", description: "Newest takes first", wRecency: 7000, wTips: 2000, wBackers: 1000 },
  { id: 2, author: "0xUltra9", name: "Crowd Favourites", description: "Most tipped posts rise", wRecency: 1000, wTips: 6000, wBackers: 3000 },
  { id: 3, author: "0xTerraceKing", name: "Real Fans Only", description: "Backed by the most different fans", wRecency: 1000, wTips: 2000, wBackers: 7000 },
  { id: 4, author: "0xMatchday", name: "Balanced Matchday", description: "A bit of everything", wRecency: 3400, wTips: 3300, wBackers: 3300 },
];

export const posts: Post[] = [
  { id: 1, author: "0xChidi", text: "CR7's discipline is the real story. Nobody trains like that for 20 years by accident.", createdAt: h(70), tips: [
    { tipper: "a", amount: 5 }, { tipper: "b", amount: 8 }, { tipper: "c", amount: 4 }, { tipper: "d", amount: 6 }, { tipper: "e", amount: 5 }] },
  { id: 2, author: "0xTemi", text: "Hot take: the best matches are the ones with no VAR drama at all.", createdAt: h(2), tips: [
    { tipper: "a", amount: 1 }] },
  { id: 3, author: "0xAda", text: "Underrated skill: a striker who always finds space in the box without the ball.", createdAt: h(30), tips: [
    { tipper: "b", amount: 2 }, { tipper: "f", amount: 2 }, { tipper: "g", amount: 1 }] },
  { id: 4, author: "0xBayo", text: "Transfer window chaos is back and I'm here for every rumour.", createdAt: h(1), tips: [] },
  { id: 5, author: "0xKemi", text: "One big tip, one fan. Proof that money isn't the same as support.", createdAt: h(48), tips: [
    { tipper: "z", amount: 40 }] },
  { id: 6, author: "0xFola", text: "Local league Saturday football beats most big matches for atmosphere.", createdAt: h(5), tips: [
    { tipper: "a", amount: 1 }, { tipper: "c", amount: 1 }, { tipper: "d", amount: 1 }, { tipper: "e", amount: 1 }] },
  { id: 7, author: "0xDayo", text: "Penalty takers need nerves of steel. Respect to anyone who steps up in a shootout.", createdAt: h(12), tips: [
    { tipper: "b", amount: 3 }, { tipper: "c", amount: 3 }] },
  { id: 8, author: "0xSade", text: "Who else rewatches old CR7 free kicks for the technique alone?", createdAt: h(8), tips: [
    { tipper: "a", amount: 2 }, { tipper: "d", amount: 2 }, { tipper: "h", amount: 2 }, { tipper: "i", amount: 2 }, { tipper: "j", amount: 2 }] },
  { id: 9, author: "0xEmeka", text: "Tactics thread: why a back three suddenly works everywhere.", createdAt: h(20), tips: [
    { tipper: "b", amount: 6 }, { tipper: "e", amount: 6 }] },
  { id: 10, author: "0xJide", text: "Fans who were here early should get something back. Not just the loudest ones.", createdAt: h(0.5), tips: [] },
];
