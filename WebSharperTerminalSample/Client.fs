namespace WebSharperTerminalSample

open WebSharper
open WebSharper.JavaScript
open WebSharper.JQuery
open WebSharper.UI.Next
open WebSharper.UI.Next.Html
open WebSharper.UI.Next.Client
open WebSharper.UI.Next.Templating
open WebSharper.JQuery
open WebSharper.JQueryTerminal

[<JavaScript>]
module Client =
    
    type FormTemplate = Templating.Template<"./template.html">

    let onDownload (pName:IRef<string>) _ _ = JS.Alert(pName.Value)

    

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
    let mutable numOfTemplates = 0
    let interpreter =
        FuncWithThis<Terminal, string->Unit>(fun this command ->
            match command with
            | Help -> this.Echo "Commands: help, clear, template"
            | Template ->
                numOfTemplates <- numOfTemplates + 1
                let id = "template" + string numOfTemplates
                let rvProjName = Var.Create ""
                let html = 
 (*                   Doc.Concat[
                        Doc.Input [on.keyPress (fun _ ev -> ev.StopPropagation()); on.keyDown (fun _ ev -> ev.StopPropagation()); on.keyUp (fun _ ev -> ev.StopPropagation()); on.input (fun _ ev -> ev.StopPropagation())] rvInputList.[numOfTemplates]
                    ]*)
                    FormTemplate.Form()
                        .ProjName(rvProjName)
                        .EventProp([on.keyPress (fun _ ev -> ev.StopPropagation()); on.keyDown (fun _ ev -> ev.StopPropagation()); on.keyUp (fun _ ev -> ev.StopPropagation()); on.input (fun _ ev -> ev.StopPropagation())])
                        .Download(onDownload rvProjName)
                        .Doc()
                this.EchoHtml ("<div id=\"" + id + "\"></div>")
                html
                |> Doc.RunById id
  (*              rvInput.View
                |> View.Map (fun _ -> "it works")
                |> Doc.TextView
                |> Doc.RunById "my"*)
            | Clear -> this.Clear()
            | Blank -> this.Echo ""
            | _ -> this.EchoHtml("Unknown command")
        )
    let i2 =
        FuncWithThis<Terminal, string->Unit>(fun this command ->
            this.Echo("")
        )
            
    let Opt =
        Options(
            Name = "Terminal1",
            Prompt = "> ",
            Greetings = "Welcome to the Terminal Test Page! See 'help' for the list of commands."
        )
    
    [<SPAEntryPoint>]
    let Main =
        Terminal("#body", i2, Opt)
