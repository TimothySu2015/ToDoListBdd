using FluentValidation;
using ToDoListBDD.API.ApplicationCommands;

namespace ToDoListBDD.API.Application.Validators;

public class UpdateTaskDescriptionCommandValidator : AbstractValidator<UpdateTaskDescriptionCommand>
{
    public UpdateTaskDescriptionCommandValidator()
    {
        RuleFor(x => x.TaskId)
            .GreaterThan(0).WithMessage("任務 ID 必須大於 0");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("請輸入任務描述")
            .MaximumLength(500).WithMessage("任務描述不能超過 500 字元");
    }
}