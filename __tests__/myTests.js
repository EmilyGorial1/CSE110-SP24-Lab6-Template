const puppeteer = require('puppeteer');

describe('Notes App E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://127.0.0.1:5500/index.html'); 
  });

  afterAll(async () => {
    await browser.close();
  });

  it('adds a new note when "Add Note" button is clicked', async () => {
    await page.click('.add-note');
    const notes = await page.$$('.note');
    expect(notes.length).toBe(1);
  });

  it('updates the content of the note', async () => {
    const note = await page.$('.note');
    await note.click();
    await page.keyboard.type('Test Note Content');
    await page.evaluate(note => note.dispatchEvent(new Event('change')), note);
    
    const notes = await page.evaluate(() => JSON.parse(localStorage.getItem('stickynotes-notes')));
    expect(notes[0].content).toBe('Test Note Content');
  });

  it('deletes the note when double-clicked', async () => {
    const note = await page.$('.note');
    await note.click({ clickCount: 2 });
    
    const notes = await page.$$('.note');
    expect(notes.length).toBe(0);

    const saved_notes = await page.evaluate(() => JSON.parse(localStorage.getItem('stickynotes-notes')));
    expect(saved_notes.length).toBe(0);
  });

  it('should save notes after page is reloaded', async () => {
    await page.click('.add-note');
    const note = await page.$('.note');
    await note.click();
    await page.keyboard.type('Persistent Note Content');
    await page.evaluate(note => note.dispatchEvent(new Event('change')), note);
    
    await page.reload();
    
    const notes = await page.$$('.note');
    expect(notes.length).toBe(1);

    const saved_notes = await page.evaluate(() => JSON.parse(localStorage.getItem('stickynotes-notes')));
    expect(saved_notes[0].content).toBe('Persistent Note Content');
  });

  it('deletes all notes when Ctrl+Shift+D is pressed', async () => {
    // Add a couple of notes first to have something to delete
    await page.click('.add-note');
    await page.click('.add-note');

    // Ensure there are notes to delete
    let notes = await page.$$('.note');
    expect(notes.length).toBeGreaterThan(0);

    // Set up the event listener for the confirmation dialog
    const listen = dialog => dialog.accept();
    page.on('dialog', listen);

    // Trigger the keypress event to delete all notes
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('D');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    // Wait for the notes to be deleted from the DOM
    await page.waitForFunction(() => {
    return document.querySelectorAll('.note').length === 0;
  });
// Re-query the notes to check if they are deleted
notes = await page.$$('.note');
expect(notes.length).toBe(0);

// Ensure localStorage is empty
const savedNotes = await page.evaluate(() => JSON.parse(localStorage.getItem('stickynotes-notes')));
expect(savedNotes.length).toBe(0);

// Remove the dialog event listener
page.off('dialog', listen);
}, 10000);

});
