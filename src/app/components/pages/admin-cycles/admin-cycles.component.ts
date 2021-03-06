import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CycleService} from '../../../services/cycle.service';
import {Cycle} from '../../../models/cycle';
import {FormGroup, FormBuilder, NgForm, Validators} from '@angular/forms';
import {MyModalService} from '../../../services/my-modal/my-modal.service';
import {AuthenticationService} from '../../../services/authentication.service';
import {NotificationsService} from 'angular2-notifications';
import {DateUtil} from '../../../utils/date';

@Component({
  selector: 'app-admin-cycles',
  templateUrl: './admin-cycles.component.html',
  styleUrls: ['admin-cycles.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminCyclesComponent implements OnInit {

  cycles: Cycle[];

  settings = {
    noDataText: 'Aucun cycle  pour le moment.',
    addButton: true,
    columns: [
      {
        name: 'name',
        title: 'Nom du cycle'
      },
      {
        name: 'start_date',
        title: 'Date de début'
      },
      {
        name: 'end_date',
        title: 'Date de début'
      }
    ]
  };

  cycleForm: FormGroup;

  constructor(private cycleService: CycleService,
              private myModals: MyModalService,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationsService,
              private formBuilder: FormBuilder,
              private myModalService: MyModalService) {
    this.createForm();
  }

  ngOnInit() {
    this.cycleService.getCycles().subscribe(
      data => {
        this.cycles = data.results.map(c => this.cycleAdapter(new Cycle(c)));
      }
    );
  }

  createForm() {
    this.cycleForm = this.formBuilder.group(
      {
        name: [null, Validators.required],
        start_date: null,
        end_date: null
      },
      {validator: this.dateValidator()}
      )
    ;
  }

  dateValidator() {
    return (group: FormGroup) => {

      const date_start = group.controls['start_date'];
      const date_end = group.controls['end_date'];

      if (date_start.value && date_end.value && date_start.value >= date_end.value) {
        return date_end.setErrors({
          dateEndBeforeDateStart: true
        });
      }

      if (!date_start.value && date_end.value) {
        return date_start.setErrors({
          dateStartMissing: true
        });
      }

      if (date_start.value && !date_end.value) {
        return date_end.setErrors({
          dateEndMissing: true
        });
      }
    };
  }

  createCycle(form: FormGroup) {
    if ( form.valid ) {
      this.cycleService.createCycle(form.value).subscribe(
        data => {
          this.myModals.get('create cycle').toggle();
          form.reset();
          this.notificationService.success('Création réussie',
            `Le cycle "${data.name}" a été crée`);

          this.cycleService.getCycles().subscribe(
            dataGetCycle => {
              this.cycles = dataGetCycle.results.map(c => new Cycle(c));
            }
          );
        },
        err => {

          let errorMessage = '';
          if (err.error.name) {
            errorMessage += `Name erreur: ${err.error.name[0]},`;
          }
          if (err.error.start_date) {
            errorMessage += `Start date erreur: ${err.error.start_date[0]},`;
          }
          if (err.error.end_date) {
            errorMessage += `End date erreur: ${err.error.end_date[0]},`;
          }

          this.myModals.get('create cycle').setErrorMessage(errorMessage);
        }
      );
    }
  }

  cycleAdapter(cycle: Cycle) {
    return {
      id: cycle.id,
      name: cycle.name,
      start_date: DateUtil.formatDay(cycle.start_date),
      end_date: DateUtil.formatDay(cycle.end_date)
    };
  }

  toggleModal() {
    const modal = this.myModalService.get('create cycle');

    if (!modal) {
      console.error('No modal named %s', 'create cycle');
      return;
    }
    modal.toggle();
  }
}
