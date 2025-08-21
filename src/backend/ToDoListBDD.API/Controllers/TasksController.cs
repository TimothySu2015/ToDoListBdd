using Microsoft.AspNetCore.Mvc;
using MediatR;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationDTOs;
using FluentValidation;

namespace ToDoListBDD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateTaskCommand> _createValidator;
    private readonly IValidator<UpdateTaskStatusCommand> _updateValidator;

    public TasksController(IMediator mediator, 
        IValidator<CreateTaskCommand> createValidator,
        IValidator<UpdateTaskStatusCommand> updateValidator)
    {
        _mediator = mediator;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskCommand command)
    {
        try
        {
            // 驗證命令
            var validationResult = await _createValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetTask), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public Task<ActionResult<TaskDto>> GetTask(int id)
    {
        // 暫時實作，後續會加入查詢功能
        return Task.FromResult<ActionResult<TaskDto>>(NotFound());
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<TaskDto>> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        try
        {
            var command = new UpdateTaskStatusCommand
            {
                TaskId = id,
                IsCompleted = request.IsCompleted
            };

            // 驗證命令
            var validationResult = await _updateValidator.ValidateAsync(command);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { Errors = errors, Message = string.Join(", ", errors) });
            }

            // 執行命令
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "伺服器發生錯誤", Error = ex.Message });
        }
    }
}