import { ChatInputCommandInteraction, SlashCommandBuilder, Client, AutocompleteInteraction } from "discord.js";

export interface Command {
    data: SlashCommandBuilder | any;
    execute: (interaction: ChatInputCommandInteraction, client?: Client) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction, client?: Client) => Promise<void>;
}
