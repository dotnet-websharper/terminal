namespace WebSharperTerminalSample

open WebSharper
open WebSharper.JavaScript
open WebSharper.JQuery
open WebSharper.UI.Next
open WebSharper.UI.Next.Client
open WebSharper.UI.Next.Templating
open WebSharper.JQueryTerminal

[<JavaScript>]
module Client =
    let EO =
        EchoOptions(
            Raw = true
        )

    let a = JQuery.Of("body")

    let interpreter =
        FuncWithThis<Terminal, string->Unit>(fun this command ->
            if command = "help" then
                this.Echo("Available commands: help, clear, template")
            elif command = "clear" then
                this.Clear()
            elif command = "template" then
                this.Echo("Template command")
            else
                this.Echo("Unknown command")
        )

            
    let Opt =
        Options(
            Name = "Terminal1",
            Prompt = ">",
            Greetings = "Welcome to the Terminal Test Page! See 'help' for the list of commands."
        )
    
    [<SPAEntryPoint>]
    let Main =
        Terminal("#body", interpreter, Opt)
