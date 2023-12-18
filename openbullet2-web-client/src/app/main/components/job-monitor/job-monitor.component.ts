import { Component, OnInit } from '@angular/core';
import { faClone, faEye, faPen, faPlus, faPowerOff, faRotate, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { TriggeredActionDto } from '../../dtos/monitor/triggered-action.dto';
import { JobMonitorService } from '../../services/job-monitor.service';
import { JobType } from '../../dtos/job/job.dto';
import { ConfirmationService, MessageService } from 'primeng/api';
import { getTriggerText } from '../../dtos/monitor/trigger.dto';
import { getActionText } from '../../dtos/monitor/action.dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-monitor',
  templateUrl: './job-monitor.component.html',
  styleUrls: ['./job-monitor.component.scss']
})
export class JobMonitorComponent implements OnInit {
  faEye = faEye;
  faRotate = faRotate;
  faPowerOff = faPowerOff;
  faPen = faPen;
  faTrashCan = faTrashCan;
  faClone = faClone;
  faPlus = faPlus;
  triggeredActions: TriggeredActionDto[] | null = null;
  getTriggerText = getTriggerText;
  getActionText = getActionText;

  constructor(
    private jobMonitorService: JobMonitorService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.reloadTriggeredActions();
  }

  reloadTriggeredActions() {
    this.triggeredActions = null;
    this.jobMonitorService.getAllTriggeredActions().subscribe(
      (triggeredActions) => {
        this.triggeredActions = triggeredActions;
      }
    );
  }

  resetAction(triggeredAction: TriggeredActionDto) {
    this.jobMonitorService.resetTriggeredAction(triggeredAction.id).subscribe(
      () => {
        this.reloadTriggeredActions();
        this.messageService.add({
          severity: 'success',
          summary: 'Reset',
          detail: `The triggered action ${triggeredAction.name} was reset`
        });
      }
    );
  }

  setEnabled(triggeredAction: TriggeredActionDto, enabled: boolean) {
    this.jobMonitorService.setTriggeredActionActive(triggeredAction.id, enabled).subscribe(
      () => {
        this.reloadTriggeredActions();
        this.messageService.add({
          severity: 'success',
          summary: 'Set enabled',
          detail: `The triggered action ${triggeredAction.name} was ` + (enabled ? 'enabled' : 'disabled')
        });
      }
    );
  }

  getJobUrl(triggeredAction: TriggeredActionDto) {
    switch (triggeredAction.jobType) {
      case JobType.MultiRun:
        return '/job/multi-run/' + triggeredAction.jobId;
      case JobType.ProxyCheck:
        return '/job/proxy-check/' + triggeredAction.jobId;
      default:
        return '/jobs';
    }
  }

  createAction() {
    this.router.navigate(['/monitor/triggered-action/create']);
  }

  editAction(triggeredAction: TriggeredActionDto) {
    this.router.navigate(['/monitor/triggered-action/edit'], {
      queryParams: {
        id: triggeredAction.id
      }
    });
  }

  cloneAction(triggeredAction: TriggeredActionDto) {
    this.router.navigate(['/monitor/triggered-action/clone'], {
      queryParams: {
        id: triggeredAction.id
      }
    });
  }

  confirmDeleteAction(triggeredAction: TriggeredActionDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the triggered action ${triggeredAction.name}?`,
      accept: () => {
        this.deleteAction(triggeredAction);
      }
    });
  }

  deleteAction(triggeredAction: TriggeredActionDto) {
    this.jobMonitorService.deleteTriggeredAction(triggeredAction.id).subscribe(
      () => {
        this.reloadTriggeredActions();
        this.messageService.add({
          severity: 'success',
          summary: 'Delete',
          detail: `The triggered action ${triggeredAction.name} was deleted`
        });
      }
    );
  }
}
