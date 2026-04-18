import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      resetPassword: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show success message on email sent', fakeAsync(() => {
    authServiceMock.resetPassword.mockResolvedValue({});
    
    component.forgotForm.setValue({ email: 'test@example.com' });
    component.onSubmit();
    tick();
    
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('test@example.com');
    expect(component.isSent).toBeTruthy();
  }));

  it('should show error if reset fails', fakeAsync(() => {
    authServiceMock.resetPassword.mockRejectedValue(new Error('Reset failed'));
    
    component.forgotForm.setValue({ email: 'test@example.com' });
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Reset failed');
    expect(component.isSent).toBeFalsy();
  }));
});
