using TechTalk.SpecFlow;
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using ToDoListBDD.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;
using ToDoListBDD.API.DomainEntities;
using ToDoListBDD.API.Controllers;
using ToDoListBDD.API.ApplicationCommands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ToDoListBDD.Tests.StepDefinitions;

[Binding]
public class TaskCreationSteps
{
    private HttpResponseMessage? _response;
    private string? _requestDescription;
    private TodoTask? _createdTask;
    private readonly IServiceProvider _serviceProvider;
    private readonly ApplicationDbContext _context;

    public TaskCreationSteps()
    {
        var services = new ServiceCollection();
        
        // 添加 Logging
        services.AddLogging();
        
        // 只註冊 InMemory 資料庫
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));
        
        // 註冊 MediatR
        services.AddMediatR(cfg => 
            cfg.RegisterServicesFromAssembly(typeof(CreateTaskCommand).Assembly));
        
        // 註冊驗證器
        services.AddTransient<FluentValidation.IValidator<CreateTaskCommand>, 
            ToDoListBDD.API.Application.Validators.CreateTaskCommandValidator>();
        services.AddTransient<FluentValidation.IValidator<ToDoListBDD.API.ApplicationCommands.UpdateTaskStatusCommand>, 
            ToDoListBDD.API.Application.Validators.UpdateTaskStatusCommandValidator>();
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
        _context.Database.EnsureCreated();
    }

    [Given(@"系統已準備好接收新任務")]
    public async Task GivenSystemIsReadyToReceiveNewTasks()
    {
        // 資料庫已經準備好
        await Task.CompletedTask;
    }

    [When(@"我提交一個新任務 ""(.*)""")]
    public async Task WhenISubmitANewTask(string description)
    {
        _requestDescription = description;
        var command = new CreateTaskCommand { Description = description };
        var mediator = _serviceProvider.GetRequiredService<IMediator>();
        var createValidator = _serviceProvider.GetRequiredService<FluentValidation.IValidator<CreateTaskCommand>>();
        var updateValidator = _serviceProvider.GetRequiredService<FluentValidation.IValidator<ToDoListBDD.API.ApplicationCommands.UpdateTaskStatusCommand>>();
        
        var controller = new TasksController(mediator, createValidator, updateValidator);
        
        var result = await controller.CreateTask(command);
        
        if (result.Result is CreatedAtActionResult createdResult)
        {
            var taskDto = createdResult.Value as ToDoListBDD.API.ApplicationDTOs.TaskDto;
            if (taskDto != null)
            {
                _createdTask = new TodoTask
                {
                    Id = taskDto.Id,
                    Description = taskDto.Description,
                    IsCompleted = taskDto.IsCompleted,
                    CreatedAt = taskDto.CreatedAt,
                    UpdatedAt = taskDto.UpdatedAt
                };
            }
            _response = new HttpResponseMessage(System.Net.HttpStatusCode.Created);
        }
        else if (result.Result is BadRequestObjectResult badResult)
        {
            _response = new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest);
            var options = new JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            _response.Content = new StringContent(JsonSerializer.Serialize(badResult.Value, options));
        }
        else
        {
            _response = new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError);
        }
    }

    [When(@"我提交一個空白任務描述")]
    public async Task WhenISubmitAnEmptyTaskDescription()
    {
        await WhenISubmitANewTask("");
    }

    [When(@"我提交一個超過500字元的任務描述")]
    public async Task WhenISubmitATaskDescriptionOver500Characters()
    {
        await WhenISubmitANewTask(new string('A', 501));
    }

    [Then(@"任務應該成功建立")]
    public void ThenTaskShouldBeCreatedSuccessfully()
    {
        Assert.NotNull(_response);
        Assert.Equal(System.Net.HttpStatusCode.Created, _response.StatusCode);
        Assert.NotNull(_createdTask);
        Assert.True(_createdTask.Id > 0);
    }

    [Then(@"任務描述應該是 ""(.*)""")]
    public void ThenTaskDescriptionShouldBe(string expectedDescription)
    {
        Assert.NotNull(_createdTask);
        Assert.Equal(expectedDescription, _createdTask.Description);
    }

    [Then(@"任務狀態應該是未完成")]
    public void ThenTaskStatusShouldBeIncomplete()
    {
        Assert.NotNull(_createdTask);
        Assert.False(_createdTask.IsCompleted);
    }

    [Then(@"任務應該有建立時間")]
    public void ThenTaskShouldHaveCreatedTime()
    {
        Assert.NotNull(_createdTask);
        Assert.True(_createdTask.CreatedAt != default);
        Assert.True(_createdTask.UpdatedAt != default);
    }

    [Then(@"應該回傳驗證錯誤")]
    public void ThenShouldReturnValidationError()
    {
        Assert.NotNull(_response);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, _response.StatusCode);
    }

    [Then(@"錯誤訊息應該是 ""(.*)""")]
    public async Task ThenErrorMessageShouldBe(string expectedMessage)
    {
        Assert.NotNull(_response);
        Assert.NotNull(_response.Content);
        var responseBody = await _response.Content.ReadAsStringAsync();
        Assert.Contains(expectedMessage, responseBody);
    }

    [Then(@"任務應該儲存到資料庫")]
    public async Task ThenTaskShouldBeSavedToDatabase()
    {
        Assert.NotNull(_createdTask);
        
        var savedTask = await _context.Tasks.FindAsync(_createdTask.Id);
        Assert.NotNull(savedTask);
        Assert.Equal(_requestDescription, savedTask.Description);
        Assert.False(savedTask.IsCompleted);
    }
}