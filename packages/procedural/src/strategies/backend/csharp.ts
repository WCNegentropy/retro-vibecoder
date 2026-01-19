/**
 * C# Backend Strategies
 *
 * Generates C# ASP.NET Core Web API projects.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * ASP.NET Core Web API strategy
 */
export const CSharpApiStrategy: GenerationStrategy = {
  id: 'csharp-dotnet',
  name: '.NET Web API',
  priority: 10,

  matches: (stack) =>
    stack.language === 'csharp' &&
    stack.archetype === 'backend' &&
    stack.framework === 'aspnet-core',

  apply: async ({ files, projectName, stack }) => {
    const cleanName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    const namespace = cleanName;

    // 1. Project File
    const packageRefs = [
      '<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />',
      '<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />',
    ];

    if (stack.database === 'postgres') {
      packageRefs.push('<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />');
      packageRefs.push('<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />');
    } else if (stack.database === 'mysql') {
      packageRefs.push('<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.0" />');
      packageRefs.push('<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />');
    } else if (stack.database === 'sqlite') {
      packageRefs.push('<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />');
      packageRefs.push('<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />');
    }

    files[`${cleanName}.csproj`] = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <InvariantGlobalization>true</InvariantGlobalization>
  </PropertyGroup>

  <ItemGroup>
${packageRefs.map(p => `    ${p}`).join('\n')}
  </ItemGroup>
</Project>
`;

    // 2. Program.cs
    let programCs = `var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
`;

    if (stack.database !== 'none') {
      programCs += `builder.Services.AddDbContext<AppDbContext>();
`;
    }

    programCs += `
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/health", () =>
{
    return new { Status = "ok", Timestamp = DateTime.UtcNow };
})
.WithName("GetHealth")
.WithOpenApi();

app.MapGet("/api", () =>
{
    return new { Message = "Welcome to ${projectName} API" };
})
.WithName("GetApi")
.WithOpenApi();

app.Run();
`;

    files['Program.cs'] = programCs;

    // 3. Properties/launchSettings.json
    files['Properties/launchSettings.json'] = JSON.stringify({
      "$schema": "https://json.schemastore.org/launchsettings.json",
      "profiles": {
        "http": {
          "commandName": "Project",
          "dotnetRunMessages": true,
          "launchBrowser": false,
          "applicationUrl": "http://localhost:5000",
          "environmentVariables": {
            "ASPNETCORE_ENVIRONMENT": "Development"
          }
        },
        "https": {
          "commandName": "Project",
          "dotnetRunMessages": true,
          "launchBrowser": false,
          "applicationUrl": "https://localhost:5001;http://localhost:5000",
          "environmentVariables": {
            "ASPNETCORE_ENVIRONMENT": "Development"
          }
        }
      }
    }, null, 2);

    // 4. appsettings.json
    const appSettings: Record<string, unknown> = {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning"
        }
      },
      "AllowedHosts": "*"
    };

    if (stack.database === 'postgres') {
      appSettings["ConnectionStrings"] = {
        "DefaultConnection": `Host=localhost;Database=${cleanName.toLowerCase()};Username=postgres;Password=postgres`
      };
    } else if (stack.database === 'mysql') {
      appSettings["ConnectionStrings"] = {
        "DefaultConnection": `Server=localhost;Database=${cleanName.toLowerCase()};User=root;Password=root`
      };
    } else if (stack.database === 'sqlite') {
      appSettings["ConnectionStrings"] = {
        "DefaultConnection": `Data Source=${cleanName.toLowerCase()}.db`
      };
    }

    files['appsettings.json'] = JSON.stringify(appSettings, null, 2);

    // 5. appsettings.Development.json
    files['appsettings.Development.json'] = JSON.stringify({
      "Logging": {
        "LogLevel": {
          "Default": "Debug",
          "Microsoft.AspNetCore": "Information"
        }
      }
    }, null, 2);

    // 6. DbContext if database is configured
    if (stack.database !== 'none') {
      let dbContextContent = `using Microsoft.EntityFrameworkCore;

namespace ${namespace};

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
`;

      if (stack.database === 'postgres') {
        dbContextContent += `            optionsBuilder.UseNpgsql("Host=localhost;Database=${cleanName.toLowerCase()};Username=postgres;Password=postgres");
`;
      } else if (stack.database === 'mysql') {
        dbContextContent += `            var connectionString = "Server=localhost;Database=${cleanName.toLowerCase()};User=root;Password=root";
            optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
`;
      } else if (stack.database === 'sqlite') {
        dbContextContent += `            optionsBuilder.UseSqlite("Data Source=${cleanName.toLowerCase()}.db");
`;
      }

      dbContextContent += `        }
    }
}
`;

      files['Data/AppDbContext.cs'] = dbContextContent;
    }

    // 7. .gitignore
    files['.gitignore'] = `## .NET
bin/
obj/
*.user
*.suo
*.cache
*.dll
*.exe
*.pdb

## IDE
.vs/
.vscode/
.idea/
*.sln.docstates

## Build
[Bb]uild/
[Oo]ut/

## NuGet
*.nupkg
**/packages/*
!**/packages/build/

## Secrets
*.pfx
*.publishsettings
appsettings.*.local.json

## Database
*.db
*.db-shm
*.db-wal
`;

    // 8. Solution file
    files[`${cleanName}.sln`] = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${cleanName}", "${cleanName}.csproj", "{00000000-0000-0000-0000-000000000001}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{00000000-0000-0000-0000-000000000001}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000001}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000001}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000001}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
`;

    // 9. Makefile
    files['Makefile'] = `DOTNET := dotnet

.PHONY: build run test clean restore publish

restore:
\t$(DOTNET) restore

build: restore
\t$(DOTNET) build

run:
\t$(DOTNET) run

watch:
\t$(DOTNET) watch run

test:
\t$(DOTNET) test

clean:
\t$(DOTNET) clean
\trm -rf bin obj

publish:
\t$(DOTNET) publish -c Release -o ./publish
`;
  },
};
