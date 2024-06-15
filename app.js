const http = require('http');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

dotenv.config();

function trimEnding(string){
  return string.split('\n')[0];
}

async function chooseAccount(url, msgLink) {
  const browser = await puppeteer.launch({
    "headless": true
  });
  const page = await browser.newPage();
  //console.log(url);
  try {
    await page.goto(url);
  } catch (error) {
    msgLink.channel.send('Could not connect to the website');
    return;
  }
  

  //getting url to click
  try {
    const aHandle = await page.$('.title > a');
    var accLink = await aHandle.evaluate(element => element.getAttribute('href'));
    //console.log({accLink});
    await page.goto(accLink);
  } catch (error) {
    console.log('Couldnt get account link: ' + error);
    return;
  }
  
  
  //getting family name
  const famName = await page.evaluate(() => Array.from(document.querySelectorAll('p.nick'), element => element.textContent));
  //console.log(famName);
  //console.log(famNameTxt);

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
  //console.log(lvl);
  browser.close();
  //console.log({classesTrimmed})
  //console.log({charNamesTrimmed});
  console.log({famName});
  //console.log({guildTxt})
  var obj = {
    famName: famName,
    guild: guildTxt,
    charNames: charNamesTrimmed,
    classes: classesTrimmed,
    levels: lvl,
    link: accLink
  };
  
  return obj;
}


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", msg => {
  if (msg.content.substring(0, 1) === '!')
  {
    var slicedCom = msg.content.slice(1, msg.content.length);
    var args = slicedCom.split(' ');

    if(args[0] === "fn")
    {
        chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=2&searchKeyword='+args[1], msg).then((info) => {
          //console.log({info});
          if(info == null){
            msg.channel.send('Could not find the player2');
            return;
          } 
          const embeds = [];
          let counter = 0;
          for( let i = 0; i < info.charNames.length; i++) {
            if(!embeds[Math.floor(counter / 25)]) {

              embeds.push(new EmbedBuilder()
                .setTitle("Family name: "+info.famName)
                .setAuthor({
                  name: "Guild: "+info.guild
                })
                .setColor(0x00AE86)
                .setFooter({ 
                  text: "Made by Michu"
                })
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
          
          embeds.forEach( e => {
            //console.log({embeds});
            msg.channel.send({ embeds: [e]});
          })

        });
        
    }
    else if(args[0] === "ch")
    {
      chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=1&searchKeyword='+args[1], msg).then((info) => {
        //console.log({info});
        if(info == null){
          msg.channel.send('Could not find the player');
          return;
        } 
        const embeds = [];
        let counter = 0;
        for( let i = 0; i < info.charNames.length; i++) {
          if(!embeds[Math.floor(counter / 25)]) {

            embeds.push(new EmbedBuilder()
              .setTitle("Family name: "+info.famName)
              .setAuthor({
                name: "Guild: "+info.guild
              })
              .setColor(0x00AE86)
              .setFooter({ 
                text: "Made by Michu"
              })
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
        
            embeds.forEach( e => {
              //console.log({embeds});
              msg.channel.send({ embeds: [e]}); //coś nie działa z wysyłaniem embeda
            })
        });
    }
    
  }
})

client.login(process.env.TOKEN);

//chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=2&searchKeyword=michukpk');