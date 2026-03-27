-- Create the trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- Assign admin role to existing admin users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email IN ('poorneshk9@gmail.com', 'punithkumar062008@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;