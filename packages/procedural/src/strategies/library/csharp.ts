/**
 * C# Library Strategy
 *
 * Generates C# library packages for NuGet.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * C# library strategy
 */
export const CSharpLibraryStrategy: GenerationStrategy = {
  id: 'library-csharp',
  name: 'C# Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'csharp',

  apply: async ({ files, projectName }) => {
    const safeName = projectName.replace(/[^a-zA-Z0-9.]/g, '');
    const ns = safeName || 'MyLibrary';

    // Solution file
    files[`${ns}.sln`] = `
Microsoft Visual Studio Solution File, Format Version 12.00
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${ns}", "src\\${ns}\\${ns}.csproj", "{00000000-0000-0000-0000-000000000001}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${ns}.Tests", "tests\\${ns}.Tests\\${ns}.Tests.csproj", "{00000000-0000-0000-0000-000000000002}"
EndProject
Global
  GlobalSection(SolutionConfigurationPlatforms) = preSolution
    Debug|Any CPU = Debug|Any CPU
    Release|Any CPU = Release|Any CPU
  EndGlobalSection
EndGlobal
`;

    // Library .csproj
    files[`src/${ns}/${ns}.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <PackageId>${ns}</PackageId>
    <Version>0.1.0</Version>
    <Description>${projectName} library</Description>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

</Project>
`;

    // Library source
    files[`src/${ns}/Library.cs`] = `namespace ${ns};

/// <summary>
/// Core library functions.
/// </summary>
public static class Library
{
    /// <summary>
    /// Generate a greeting message.
    /// </summary>
    public static string Greet(string name, string greeting = "Hello")
    {
        return $"{greeting}, {name}!";
    }

    /// <summary>
    /// Add two numbers.
    /// </summary>
    public static int Add(int a, int b)
    {
        return a + b;
    }
}
`;

    // Test .csproj
    files[`tests/${ns}.Tests/${ns}.Tests.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.9.0" />
    <PackageReference Include="xunit" Version="2.7.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.6" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\\..\\src\\${ns}\\${ns}.csproj" />
  </ItemGroup>

</Project>
`;

    // Tests
    files[`tests/${ns}.Tests/LibraryTests.cs`] = `using Xunit;

namespace ${ns}.Tests;

public class LibraryTests
{
    [Fact]
    public void Greet_DefaultGreeting_ReturnsHello()
    {
        Assert.Equal("Hello, World!", Library.Greet("World"));
    }

    [Fact]
    public void Greet_CustomGreeting_ReturnsCustom()
    {
        Assert.Equal("Hi, World!", Library.Greet("World", "Hi"));
    }

    [Fact]
    public void Add_ReturnsSum()
    {
        Assert.Equal(3, Library.Add(1, 2));
    }
}
`;

    // .gitignore
    files['.gitignore'] = `bin/
obj/
*.user
*.suo
.vs/
*.nupkg
`;

    // Makefile
    files['Makefile'] = `DOTNET := dotnet

.PHONY: build test clean pack publish

build:
\t$(DOTNET) build

test:
\t$(DOTNET) test

clean:
\t$(DOTNET) clean

pack:
\t$(DOTNET) pack -c Release

publish: pack
\t$(DOTNET) nuget push **/*.nupkg
`;
  },
};
