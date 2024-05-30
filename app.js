const http = require('http');
const discord = require("discord.js");
const puppeteer = require('puppeteer');
const client = new discord.Client();
const dotenv = require('dotenv');
const { MessageEmbed } = require('discord.js');

dotenv.config();

/*
function createEmbed(info)
{
    const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Family name: ' + info.famName)
            .setDescription('Guild: ' + info.guild)
            .setThumbnail('https://i.imgur.com/AfFp7pu.png')
            .addFields(
                { name: 'Regular field title', value: 'Some value here' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
            )
            .addField('Inline field title', 'Some value here', true)
            .setImage('https://cdn.discordapp.com/attachments/521372812087263255/874839051780378694/unknown.png')
            .setTimestamp()
    return exampleEmbed;
}
*/
function trimEnding(string){
  return string.split('\n')[0];
}

async function chooseAccount(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  //getting url to click
  const aHandle = await page.$('.title > a');
  //console.log(aHandle);
  const accLink = await aHandle.evaluate(element => element.getAttribute('href'));
  //console.log(accLink);
  //const elem = await page.$$eval('div.title > a', href => href.getAttribute('href'));
  // //*[@id="wrap"]/div/div[3]/article/div/div/div[3]/ul/li/div[2]/a
  //const accLink = await elem.$eval('a', element => element.getAttribute('href'));
  //console.log('link: ' + elem);

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
  //const lvl = await emHandle.evaluate(element => element.textContent);
  console.log(lvl);

  console.log(classesTrimmed)
  console.log(charNamesTrimmed);
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


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
})

client.on("message", msg => {
  if (msg.content.substring(0, 1) === '!')
  {
    var slicedCom = msg.content.slice(1, msg.content.length);
    var args = slicedCom.split(' ');

    if(args[0] === "fn")
    {
        chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=2&searchKeyword='+args[1]).then((info) => {
          //console.log(info.charNames)
          //console.log(info.classes)
          const embed = new discord.MessageEmbed()
            .setTitle("Family name: "+info.famName)
            .setAuthor("Guild: "+info.guild)
            .setColor(0x00AE86)
            .setFooter("Made by Michu")
            .setTimestamp()
            .setURL(info.link)
            for( let i = 0; i < info.charNames.length; i++) {
            embed.addFields({ 
                name: info.charNames[i],
                value: info.levels[i] + " - " + info.classes[i],
                inline: true
              })
            }
            
            msg.channel.send( {embed} );
        });
        
    }
    else if(args[0] === "ch")
    {
      chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=1&searchKeyword='+args[1]).then((info) => {

          const embed = new discord.MessageEmbed()
            .setTitle("Family name: "+info.famName)
            .setAuthor("Guild: "+info.guild)
            .setColor(0x00AE86)
            .setFooter("Made by Michu")
            .setTimestamp()
            .setURL(info.link)
            
            msg.channel.send( {embed} );
        });
    }
    
  }
})

client.login(process.env.TOKEN);

//chooseAccount('https://www.naeu.playblackdesert.com/en-US/Adventure?region=EU&searchType=2&searchKeyword=michukpk');