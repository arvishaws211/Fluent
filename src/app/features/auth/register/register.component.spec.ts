import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate all fields', () => {
    const form = component.registerForm;
    expect(form.valid).toBeFalsy();
    
    form.setValue({
      displayName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'password123'
    });
    expect(form.valid).toBeTruthy();
  });

  it('should require password length of 6', () => {
    const password = component.registerForm.controls.password;
    password.setValue('12345');
    expect(password.errors?.['minlength']).toBeTruthy();
    
    password.setValue('123456');
    expect(password.errors).toBeNull();
  });

  it('should register and navigate on success', fakeAsync(() => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    authServiceMock.register.mockResolvedValue({});
    
    component.registerForm.setValue({
      displayName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(authServiceMock.register).toHaveBeenCalledWith('alex@example.com', 'password123');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  }));
});
