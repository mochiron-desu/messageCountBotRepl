const express = require('express');
const app = express();
const port = 3000;
const cron = require('cron');


app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
// =================================
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const uri =`mongodb+srv://${process.env.USER}:${process.env.PASS}@messagecounterbot.h8qimpe.mongodb.net/?retryWrites=true&w=majority`;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

const mongo = new MongoClient(uri);

async function getScore(channelId) {
    try {
        const database = mongo.db('botData')
        const collection = database.collection('messageData');
        const pipelineQuery = [
            { $project: { "username": 1, "_id": 0 } },
            { $group: { "_id": "$username", "count": { $sum: 1 } } }
        ]
        const resultCursor = collection.aggregate(pipelineQuery);
        const allValues = await resultCursor.toArray();
        return allValues
    } catch {
    }
}

client.on('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    const guildID = ''
    const guild = client.guilds.cache.get(guildID);
    let commands
    if (guild) {
        commands = guild.commands;
    }
    else {
        commands = client.application?.commands
    }
    commands?.create({
        name: 'ping',
        description: 'Replies with pong!',
    })
    commands?.create({
        name: 'leaderboard',
        description: 'Returns the current scoreboard!',
    })
})

// command Deployer trigger
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName, options } = interaction
    if (commandName === "ping") {
        interaction.reply({
            content: 'Pong!',
            ephemeral: true
        })
    }
    else if (commandName === "leaderboard") {
        const scoreEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Scores")
            .setDescription("Message Scores !");
        score = await getScore(interaction.channelId).catch(console.dir);
        // adding field to the embed
        for (i = 0; i < score.length; i++) {
            scoreEmbed.addFields({name:`${score[i]._id}`, value:`${score[i].count}`})
        }
        interaction.reply({ embeds: [scoreEmbed] });
    }
})

client.on('messageCreate', async (message) => {
    if (message.author === client.user || message.author.bot) {
        return
    }
    async function addDetails() {
        try {
            const database = mongo.db('botData');
            const collection = database.collection('messageData');

            var messageArr = message.content.split(" ");


            var username = message.author.username;
            var messagecount = messageArr.length;
            var timestamp = message.createdTimestamp;

            const data = {
                "username": username,
                "messagecount": messagecount,
                "timestamp": timestamp
            }

            const result = await collection.insertOne(data);

            console.log(`A document was inserted with the _id: ${result.insertedId}`)
        } catch (err) {
            console.log(err)
        }
    }
    addDetails().catch(console.dir);

})

client.login(process.env.TOKEN)