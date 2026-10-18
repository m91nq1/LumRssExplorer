import { test } from "node:test";
import assert from "node:assert/strict";
import { correctArticleArtTopics, tagArticleTopics } from "./topicTagger";

test("Art requires complete words and relevant context, not substring matches", () => {
  for (const [title, summary, source] of [
    ["College GameDay stays in Utah", "Broadcast from the state of Utah.", "Yahoo Sports"],
    ["Build authentication from scratch", "Design a software architecture for your server.", "DEV Community"],
    ["ColdCraft Studio", "Personalized cold emails for freelancers.", "DEV Community"],
    ["Florida basketball exhibition", "Live scores and tickets for the game.", "Yahoo Sports"],
    ["New startup launches today", "A moment to celebrate the latest update.", "News"],
    ["Andrew Tate speaks", "A statement about the Toyota Prado.", "News"],
  ]) {
    assert.ok(!tagArticleTopics(title, summary, source).includes("Art"), title);
    assert.ok(!correctArticleArtTopics(title, summary, source, ["Art"]).includes("Art"), title);
  }
});

test("genuine art reporting and dedicated art feeds remain available", () => {
  for (const [title, summary, source] of [
    ["Museum opens new exhibition", "Paintings and sculpture by a contemporary artist.", "News"],
    ["Tate Modern announces its next show", "A new art exhibition opens this week.", "News"],
    ["Architecture of a new museum", "The architect describes the building.", "News"],
    ["New exhibition announced", "The latest programme.", "ArtReview"],
    ["Paintings from the permanent collection", "", "Contemporary Art Daily"],
    ["Museums announce their autumn exhibitions", "", "News"],
    ["Galleries show emerging sculptors", "", "News"],
    ["Artist Dorothy O’Connor speaks at the Art Park", "", "News"],
  ]) {
    assert.ok(tagArticleTopics(title, summary, source).includes("Art"), title);
    assert.ok(correctArticleArtTopics(title, summary, source, ["Art"]).includes("Art"), title);
  }
});

test("Art means visual arts, not broad culture or a publisher's whole feed", () => {
  for (const [title, summary, source] of [
    ["New poetry collection wins the Booker Prize", "", "News"],
    ["Theatre and ballet programme announced", "", "News"],
    ["Cannes film festival opens", "A documentary film premieres.", "ArtReview"],
    ["Taylor Swift performs at Academy Museum gala", "The singer performed a new song.", "News"],
    ["Rapper named artist of the year", "", "News"],
    ["Netflix removes Cillian Murphy's masterpiece drama", "The film leaves streaming soon.", "Digital Spy"],
    ["Restaurant unveils new interior design", "", "Wallpaper*"],
    ["Circle13 updates pétanque", "Design-led interiors and small plates.", "Wallpaper*"],
    ["New iPhone camera app", "Black-and-white photography tools.", "PetaPixel"],
    ["Latest update", "", "Contemporary Art Daily"],
  ]) {
    assert.ok(!tagArticleTopics(title, summary, source).includes("Art"), title);
    assert.ok(!correctArticleArtTopics(title, summary, source, ["Art"]).includes("Art"), title);
  }
});

test("Art correction preserves other tags and never leaves an empty topic list", () => {
  assert.deepEqual(correctArticleArtTopics("Software architecture", "", "DEV Community",
    ["AI & Technology", "Art"]), ["AI & Technology"]);
  assert.ok(correctArticleArtTopics("Latest state update", "", "News", ["Art"]).length);
  assert.deepEqual(correctArticleArtTopics("Latest update", "", "News", ["Sports"]), ["Sports"]);
});
