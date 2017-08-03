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
    
    let rvInput = Var.Create ""
    let html = 
        Doc.Input [] rvInput


    let (|Help|_|) (command: string) =
        if command = "help" then
            Some ()
        else
            None

    let (|Clear|_|) (command: string) =
        if command = "clear" then
            Some()
        else
            None

    let (|Template|_|) (command: string) =
        if command = "template" then
            Some()
        else
            None
    
    let (|Blank|_|) (command: string) =
        if command = "" then
            Some()
        else
            None

    let interpreter =
        FuncWithThis<Terminal, string->Unit>(fun this command ->
            match command with
            | Help -> this.Echo "Commands: help, clear, template"
            | Template ->
                this.EchoHtml "<div id=\"my\"></div>"
                html
                |> Doc.RunById "my"
  (*              rvInput.View
                |> View.Map (fun _ -> "it works")
                |> Doc.TextView
                |> Doc.RunById "my"*)
            | Clear -> this.Clear()
            | Blank -> this.Echo ""
            | _ -> this.EchoHtml("Unknown command")
        )

            
    let Opt =
        Options(
            Name = "Terminal1",
            Prompt = "> ",
            Greetings = "Welcome to the Terminal Test Page! See 'help' for the list of commands."
        )
    
    [<SPAEntryPoint>]
    let Main =
        Terminal("#body", interpreter, Opt)
