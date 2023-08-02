const config = require('./config')
const { Client, ActivityType, OAuth2Scopes, EmbedBuilder } = require('discord.js')
const logger = require("./logger");
const ecologger = require("./economy");
const msgLogger = require("./msgLogger");
const Economy = require('discord-economy-super/mongodb')

require("dotenv").config();


const client = new Client({
    intents: ['GuildMembers', 'GuildMessages', 'Guilds', 'MessageContent']
})

let eco = new Economy({
    connection: {
        connectionURI: process.env.MONGO_URI,
        dbName: 'pointForFR',
        collectionName: 'pointForFR'
    },

    dailyAmount: 100,
    workAmount: [50, 200],
    weeklyAmount: 5000
})


const getUser = userID => client.users.cache.get(userID)

client.on('messageCreate', async message => {
  
    const prefix = '!'

  const messageInGuild = message.guild ? true : false;
			msgLogger.info(`[${messageInGuild ? "GUILD] [" + message.guild.name : "DM"}] [${message.channel.name}] [${message.author.tag}]: ${message.content}`);
  
    const messageContent = message.content
    const splittedMessage = messageContent.trim().split(' ')

    const command = splittedMessage[0]
    const args = splittedMessage.slice(1)

    let guild = eco.cache.guilds.get({
        guildID: message.guild.id
    })

    let user = eco.cache.users.get({
        memberID: message.author.id,
        guildID: message.guild.id
    })

    const userID = message.mentions.members?.first()?.id ||
        message.guild.members.cache.find(member => member.user.username == args[0])?.id
        || getUser(args[0])?.id

    let argumentUser = eco.cache.users.get({
        memberID: userID,
        guildID: message.guild.id
    })

    const shop = eco.cache.shop.get({
        guildID: message.guild.id
    }) || []

    const inventory = eco.cache.inventory.get({
        guildID: message.guild.id,
        memberID: message.author.id
    }) || []

    const history = eco.cache.history.get({
        guildID: message.guild.id,
        memberID: message.author.id
    }) || []

    if (message.author.bot) return

    if (userID && !argumentUser) {
        argumentUser = await eco.users.create(userID, message.guild.id)
    }

    if (!guild) {
        guild = await eco.guilds.create(message.guild.id)
    }

    if (!user) {
        const ecoUser = await eco.users.get(message.author.id, message.guild.id)

        if (ecoUser) {
            eco.cache.users.update({
                guildID: message.guild.id,
                memberID: message.author.id
            })

            user = ecoUser
            return
        }

        user = await guild.users.create(message.author.id)
    }

    if (command == prefix + 'help') {
          const exampleEmbed = new EmbedBuilder() 
	.setColor(0x0099FF)
	.setTitle('aide')
	.setAuthor({ name: 'betawolfy', iconURL: 'https://i.imgur.com/CvYWXEs.png', url: 'http://www.betawolfy.me' })
	.setDescription(`${message.author}, here's the help for this bot :\n\n` +

            `### Etat major uniquement:\n\n` +
            `\`${prefix}add <user> <amount>\` - ajoute des points à l'utilisateur mentionné. \n` +
            `\`${prefix}remove <user> <amount | all>\` - soustrait des points à l'utilisateur mentionné\n` +
            `\`${prefix}ping\` - Montre la latence du bot.\n\n` +
                  
            `### Utilisable par tous\n\n` +
            `\`${prefix}help\` - Montre ce message.\n` +
            `\`${prefix}balance [user]\` - montre la balance de l'utilisateur mentionné\n` +
            `\`${prefix}bal\` - montre votre balance\n` +
            `\`${prefix}leaderboard\` - montre le top avec le plus de point\n`)
	.setImage('https://i.imgur.com/FTnZ0LU.png')
	.setFooter({ text: 'Réalisé avec amour par betawolfy', iconURL: 'https://i.imgur.com/xqfxDcr.png' });
      
logger.info(`[${message.guild.id}] La commande help a bien été executé par ${message.author}`);
message.channel.send({ embeds: [exampleEmbed] });
            
    }

    if (command == prefix + 'ping') {
        const msg = await message.channel.send('Envois des requêtes à discord...')
        const editingLatency = msg.createdTimestamp - message.createdTimestamp

     if(message.author.id == "481988447167447050" || message.author.id == "836640376906579998") {
const corePingMessage = await msg.edit(
            '🏓 | **__Core:__**\n' +
            `Bot Latence: **${editingLatency}ms**\n` +
            `WebSocket latence: **${client.ws.ping}ms**\n\n` +

            '🏓 | **__Database:__**\n' +
            'test de lecture, écriture et suppression en cours...'
        )

        const databasePing = await eco.database.ping()

        corePingMessage.edit(
            '🏓 | **__Core:__**\n' +
            `Bot Latence: **${editingLatency}ms**\n` +
            `WebSocket latence: **${client.ws.ping}ms**\n\n` +

            '🏓 | **__Database:__**\n' +
            `Lecture: **${databasePing.readLatency}ms**\n` +
            `Ecriture: **${databasePing.writeLatency}ms**\n` +
            `Suppression: **${databasePing.deleteLatency}ms**\n`
        )
      } 
      else  {
        message.reply(":x: - Vous êtes pas autorisé à faire cette commande.")
      }
    }

    if (command == prefix + 'invite') {
        const inviteLink = client.generateInvite({
            permissions: ['Administrator'],
            scopes: [OAuth2Scopes.Bot]
        })

        message.channel.send(
            `${message.author}, here's the link to invite this bot:\n\n${inviteLink}`
        )
    }
  


    if (command == prefix + 'add') {
        const [userID] = args
        const user = message.mentions.users.first() || getUser(userID)
  if(message.author.id == "432116536866766849" || message.author.id == "481988447167447050" || message.author.id == "1096147506016043193") {    
        if (!userID) {
            return message.channel.send(
                `:warning: - ${message.author}, préciser à qui vous voulez ajouter les points.`
            )
        }

        if (!user) {
            return message.channel.send(
                `:x: - ${message.author}, Cette personne n'existe pas.`
            )
        }

        const amount = parseInt(args[1])

        if (!amount) {
            return message.channel.send(
                `:warning: - ${message.author}, préciser combien de points vous voulez ajouter`
            )
        }

        if (isNaN(amount)) {
            return message.channel.send(
                `${message.author}, veuillez indiquer un montant valide.`
            )
        }


        await argumentUser.balance.add(amount)
          message.delete(1000);
    ecologger.info(`[${message.guild.id}] ${message.author.id} à ajouté ${amount} à ${user}`);
        const addMoneyEmbed = new EmbedBuilder() 
	.setColor(0x5cc953)
	.setTitle(':white_check_mark: - ajout de point!')
	.setDescription(`${message.author}, Je confirme l'addition de **${amount}** point au **${user}**`)
	.setFooter({ text: 'Réalisé avec amour par betawolfy', iconURL: 'https://i.imgur.com/xqfxDcr.png' });

    message.channel.send({ embeds: [addMoneyEmbed] });
    }
      else {
        message.reply(":x: - vous n'êtes pas autorisé à faire cette commande.")
        ecologger.warn(`${message.author} à essayé de s'**ajouter** des points!!`);
        const channel = client.channels.cache.get('1101437306642120806');
channel.send(`${message.author} à essayé de **AJOUTER** des points!! veuillez le warn. `);
      }
    }
      
if (command == prefix + 'update') {
        const [userID] = args
        const user = message.mentions.users.first() || getUser(userID)

        if (!userID) {
            return message.channel.send(
                `${message.author}, please specify a user to force update kandi to.`
            )
        }

        if (!user) {
            return message.channel.send(
                `${message.author}, user not found.`
            )
        }

        const amount = parseInt(args[1])

        if (!amount) {
            return message.channel.send(
                `${message.author}, please specify the number 1.`
            )
        }

        if (isNaN(amount)) {
            return message.channel.send(
                `${message.author}, please specify the number 1.`
            )
        }


        await argumentUser.balance.add(0)
          message.delete(1000);
        logger.info(`${message.author} à force update le compte de ${user}`);
        message.channel.send(
            `${message.author}, successfully updated **${user}**'s balance.`
        )
    }
  
    if (command == prefix + 'remove') {
        const [userID] = args
        const user = message.mentions.users.first() || getUser(userID)

  if(message.author.id == "432116536866766849" || message.author.id == "481988447167447050" || message.author.id == "1096147506016043193") {    
        if (!userID) {
            return message.channel.send(
                `:warning: - ${message.author}, préciser à qui vous voulez retirer les points..`
            )
        }

        if (!user) {
            return message.channel.send(
                `:x: - ${message.author}, Cette personne n'existe pas.`
            )
        }

        const userBalance = await argumentUser.balance.get() || 0
        const amount = args[1] == 'all' ? userBalance : parseInt(args[1])

        if (!amount) {
            return message.channel.send(
                `:warning: - ${message.author}, préciser combien de points vous voulez retirer`
            )
        }

        if (isNaN(amount)) {
            return message.channel.send(
                `:warning: - ${message.author}, veuillez indiquer un montant valide.`
            )
        }


        await argumentUser.balance.subtract(amount)
          message.delete(1000);
        ecologger.info(`${message.author} à supprimé ${amount} points à ${user}`);
      const removeMoneyEmbed = new EmbedBuilder() 
	.setColor(0xc95b53)
	.setTitle(':white_check_mark: - retrait de point!')
	.setDescription(`${message.author}, Je confirme la soustraction de **${amount}** point au **${user}**`)
	.setFooter({ text: 'Réalisé avec amour par betawolfy', iconURL: 'https://i.imgur.com/xqfxDcr.png' });

    message.channel.send({ embeds: [removeMoneyEmbed] });
    }
      else {
        message.reply(":x: - Vous êtes pas autorisé à faire cette commande.")
        ecologger.warn(`${message.author} à essayé de **soustraire** des points!!`);
        const channel = client.channels.cache.get('1101437306642120806');
channel.send(`${message.author} à essayé de **soustraire** des points!!`);
      }
    }


    if (command == prefix + 'balance') {
        const [userID] = args

        const member = message.mentions.users.first()


        const economyUser = member ? argumentUser : user
        const balanceData = eco.cache.balance.get({ memberID: member.id, guildID: message.guild.id })

        const [balance, bank] = [balanceData?.money, balanceData?.bank]

        message.channel.send(
            `${getUser(economyUser.id)}'s balance:\n` +
            `kandi: **${balance || 0}**.\n`
        )
    }

   if (command == prefix + 'bal') {
        const [userID] = args

        const member =
            message.mentions.users.first() ||
            getUser(userID)


        const economyUser = member ? argumentUser : user
        const balanceData = eco.cache.balance.get({ memberID: message.author.id, guildID: message.guild.id })

        const [balance, bank] = [balanceData?.money, balanceData?.bank]

        message.channel.send(
            `${getUser(economyUser.id)}'s balance:\n` +
            `kandi: **${balance || 0}**.\n`
        )
    }

    if (command == prefix + 'transfer') {
        const [id, amountString] = args

        const sender = user
        const receiver = argumentUser

        const senderBalance = await sender.balance.get()
        const amount = amountString == 'all' ? senderBalance : parseInt(amountString)

        if (!id) {
            return message.channel.send(
                `${message.author}, please specify a user to transfer kandi to.`
            )
        }

        if (!userID) {
            return message.channel.send(`${message.author}, user not found.`)
        }

        if (!amount) {
            return message.channel.send(
                `${message.author}, please specify an amount of kandi to transfer.`
            )
        }

        if (senderBalance < amount) {
            return message.channel.send(
                `${message.author}, you don't have enough kandi` +
                'to perform this transfer.'
            )
        }

        const transferingResult = await receiver.balance.transfer({
            amount,
            senderMemberID: message.author.id,

            sendingReason: `transfered ${amount} kandi to ${getUser(argumentUser.id).tag}.`,
            receivingReason: `received ${amount} kandi from ${message.author.tag}.`
        })

        message.channel.send(
            `${message.author}, you transfered **${transferingResult.amount}** ` +
            `kandi to ${getUser(argumentUser.id)}.`
        )
      console.log(`---------`)
        var d = new Date();
console.log(d.toLocaleString());
      console.log(`${message.author} transfered **${transferingResult.amount}** ` +
            `kandi to ${getUser(argumentUser.id)}.`)
      
      console.log(`---------`)
    }

    if (command == prefix + 'leaderboard') {
        const rawLeaderboard = await guild.leaderboards.money()

        const leaderboard = rawLeaderboard
            .filter(lb => !getUser(lb.userID)?.bot)
            .filter(lb => !!lb.money)

        if (!leaderboard.length) {
            return message.channel.send(`${message.author}, there are no users in the leaderboard.`)
        }

      const leadEmbed = new EmbedBuilder() 
	.setColor(0x0099FF)
	.setTitle(`**${message.guild.name}** - Money Leaderboard **[${leaderboard.length}]**`)
	.setAuthor({ name: 'all the server', iconURL: 'https://i.imgur.com/FTnZ0LU.png', url: 'http://www.betawolfy.me' })
	.setDescription(`${leaderboard
                .map((lb, index) => `${index + 1} - <@${lb.userID}> - **${lb.money}** points`)
                .join('\n')}`)
	.setFooter({ text: 'Réalisé avec amour par betawolfy', iconURL: 'https://i.imgur.com/xqfxDcr.png' });

message.channel.send({ embeds: [leadEmbed] });
    }
if (command == prefix + 'poll') {
let sayChannel = message.mentions.channels.first();
if (!sayChannel) return message.channel.send(`:x:| ${message.author} mention a channel First`)
    let sayMsg = args.slice(1 || 0, args.length).join(" ");
    if (!sayMsg) return message.channel.send(` Say Some Message To Poll`) 
    var role = message.member.highestRole;
    const embed = new EmbedBuilder() 
        .setColor(0x452565)
        .setFooter(`Poll By: ${message.author.username}`)
					.addField(`Poll message: ${sayMsg}`)
						.addField(`Server ${message.guild.name}`)
						.addField(`Author ${message.author.username}`)
				.setImage(`https://cdn.discordapp.com/attachments/883889484658245633/912424602033090681/standard_2.gif`)
    .setTimestamp()
    message.channel.send(`Your poll Is Ready On <#${sayChannel.id}>`)
    sayChannel.send({embed}).then(m => {
        m.react('✅');
        m.react('❌');
					m.react('🤔');
       }) 
.catch({});

}
  

})


client.on('ready', () => {
    var d = new Date();
console.log(d.toLocaleString());
    console.log(`${client.user.tag} is starting...\n\nOS Name: P0nyOS v.10.0.22621.1848\nCopyright (c) 2016-2023, ponytown team, inc\n\nIntel Processor\n\nMemory test: 42206969 OK\n\nAward Plug and Play BIOS Exension v1.0A\nInictialize Plug and Play Card...\nPnP init Completed\n\nDetecting Primary Master ... BTAWOL 021005\nDetecting Primary Slave ... LENOVO PT-2023\nDetecting Secondary Master ... Skip\nDetecting Secondary Slave ... none_\n\n\n\n Loading ${client.user.tag}`)
    console.log(`- All system online`)

    client.user.setActivity('the FR discord', {
        type: ActivityType.Watching,
    })
})


// core events
eco.on('ready', async economy => {
    console.log('Economy is ready!')
    eco = economy
})


eco.on('destroy', () => {
    console.log('Economy is destroyed.')
})


// balance events
eco.on('balanceSet', data => {
    console.log(`Set ${data.amount} kandi for ${getUser(data.memberID).tag}.`)
})

eco.on('balanceAdd', data => {
    console.log(`---------`)
    var d = new Date();
console.log(d.toLocaleString());
    console.log(`Added ${data.amount} kandi to ${getUser(data.memberID).tag}.`)
  console.log(`---------`)
})

eco.on('balanceSubtract', data => {
  console.log(`---------`)
    var d = new Date();
console.log(d.toLocaleString());
    console.log(`Subtracted ${data.amount} kandi for ${getUser(data.memberID).tag}.`)
  console.log(`---------`)
})


// bank events
eco.on('bankSet', data => {
    console.log(`Set ${data.amount} kandi in ${getUser(data.memberID).tag}'s bank.`)
})

eco.on('bankAdd', data => {
    console.log(`Added ${data.amount} kandi to ${getUser(data.memberID).tag}'s bank.`)
})

eco.on('bankSubtract', data => {
    console.log(`Subtracted ${data.amount} kandi from ${getUser(data.memberID).tag}'s bank.`)
})


// shop events
eco.on('shopClear', cleared => {
    if (cleared) console.log('The shop was cleared successfully!')
    else console.log('The shop was not cleared!')
})

eco.on('shopItemAdd', item => {
    console.log(`Added item "${item.name}" to the shop.`)
})

eco.on('shopItemBuy', data => {
    console.log(
        `${getUser(data.boughtBy).tag} has bought the item "${data.item.name}" ` +
        `for ${data.item.price} kandi.`
    )
})


eco.on('shopItemEdit', data => {
    console.log(
        `Edited item "${data.changedProperty}" property in item ${data.item.name} in the shop. ` +
        `Value before change: "${data.oldValue}". Value after change: "${data.newValue}".`
    )
})

eco.on('shopItemUse', data => {
    console.log(`${getUser(data.usedBy).tag} has used the item "${data.item.name}".`)
})

require('./server')();
client.login(process.env.DISCORD_TOKEN);

//a