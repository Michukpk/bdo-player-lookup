const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');
const puppeteer = require('puppeteer');


function trimEnding(string){
    return string.split('\n')[0];
  }
  
  async function chooseAccount(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
  
    //getting url to click
    const aHandle = await page.$('.title > a');
    const accLink = await aHandle.evaluate(element => element.getAttribute('href'));
  
    await page.goto(accLink);
  
    //getting family name
    const [elem1] = await page.$x('//*[@id="wrap"]/div/div/article[1]/div/div/div/div[1]/div/div/div/p');
    const famName = await elem1.getProperty('textContent');
    const famNameTxt = await famName.jsonValue();
  
    //getting guild name
    const spanContent = await page.evaluate(() => Array.from(document.querySelectorAll('span.desc.guild'), element => element.textContent));
    guildTxt = spanContent[0].trim();
  
    //getting an array of character names and classes
    const charNames = await page.evaluate(() => Array.from(document.querySelectorAll('p.character_name'), element => element.textContent));
    const classes = await page.evaluate(() => Array.from(document.querySelectorAll('span.character_symbol'), element => element.textContent));
  
    //trim all the spaces and newlines
    var charNamesTrimmed = charNames.map(string => string.trim());
    const classesTrimmed = classes.map(string => string.trim());
  
    //remove "Main character" ending
    for (let index = 0; index < charNamesTrimmed.length; index++) {
      charNamesTrimmed[index] = trimEnding(charNamesTrimmed[index])
    }
  
    // getting char levels
    const lvl = await page.evaluate(() => Array.from(document.querySelectorAll('.character_info > span:nth-child(2) > em'), element => element.textContent));
    console.log(lvl);
  
    console.log({classesTrimmed})
    console.log({charNamesTrimmed});
    console.log({famNameTxt});
    //console.log({guildTxt})
    var obj = {
      famName: famNameTxt,
      guild: guildTxt,
      charNames: charNamesTrimmed,
      classes: classesTrimmed,
      levels: lvl,
      link: accLink
    };
    
    return obj;
  }
  

  module.exports = {
    data: new SlashCommandBuilder()
    .setName('search')
    .setDescription("Lookup BDO EU player family name")
    .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of lookup Family name or Character name')
                .setRequired(true)
                .addChoices(
                    { name: "Family name", value: "fn" },
                    { name: "Character name", value: "ch"},
                ))
    .addStringOption(option =>
            option
                .setName('value')
                .setDescription('value')
                .setRequired(true)),
    async execute (interaction) {

        chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=2&searchKeyword=blckd').then((info) => {
          //console.log(info.charNames)
          //console.log(info.classes)
          const embeds = [];
          let counter = 0;
          for( let i = 0; i < info.charNames.length; i++) {
            if(!embeds[Math.floor(counter / 25)]) {

              embeds.push(new discord.MessageEmbed()
                .setTitle("Family name: "+info.famName)
                .setAuthor("Guild: "+info.guild)
                .setColor(0x00AE86)
                .setFooter("Made by Michu")
                .setTimestamp()
                .setURL(info.link)
              )
            }
                embeds[Math.floor(counter / 25)].addFields({ 
                    name: info.charNames[i],
                    value: info.levels[i] + " - " + info.classes[i],
                    inline: true
                  })
                counter++;
            }
            
        });

        await interaction.reply(embeds);
    }
  }