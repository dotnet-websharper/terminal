#load "tools/includes.fsx"
open IntelliFactory.Build

let bt =
    BuildTool().PackageId("Zafir.JQueryTerminal")
        .VersionFrom("Zafir")
        .WithFSharpVersion(FSharpVersion.FSharp30)
        .WithFramework(fun f -> f.Net40)

let main =
    bt.Zafir.Extension("WebSharper.JQueryTerminal")
        .SourcesFromProject()
        .Embed([])
        .References(fun r -> [])

let tests =
    bt.Zafir.SiteletWebsite("WebSharper.JQueryTerminal.Tests")
        .SourcesFromProject()
        .Embed([])
        .References(fun r ->
            [
                r.Project(main)
                r.NuGet("Zafir.Testing").Latest(true).Reference()
                r.NuGet("Zafir.UI.Next").Latest(true).Reference()
            ])

bt.Solution [
    main
    tests

    bt.NuGet.CreatePackage()
        .Configure(fun c ->
            { c with
                Title = Some "[A[BWebSharper.JQueryTerminal-1.5.3"
                LicenseUrl = Some "http://websharper.com/licensing"
                ProjectUrl = Some "https://github.com/intellifactory/https://github.com/intellifactory/websharper.jqueryterminal"
                Description = "WebSharper Extension for JQueryTerminal-1.5.3"
                RequiresLicenseAcceptance = true })
        .Add(main)
]
|> bt.Dispatch
