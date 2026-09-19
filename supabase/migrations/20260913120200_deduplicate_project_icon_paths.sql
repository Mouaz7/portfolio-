-- Point existing project rows at byte-identical shared assets. The visual
-- content stays unchanged while duplicate public files can be removed.
update public.project
set cover_image_href = case cover_image_href
  when '/project-icons/android.svg' then '/skill-icons/mobile-android.svg'
  when '/project-icons/category-systems.svg' then '/skill-icons/devops-linux.svg'
  when '/project-icons/cplusplus.svg' then '/skill-icons/backend-c-plus-plus.svg'
  when '/project-icons/githubactions.svg' then '/skill-icons/devops-ci-cd.svg'
  when '/project-icons/java.svg' then '/skill-icons/backend-java.svg'
  when '/project-icons/javascript.svg' then '/skill-icons/frontend-javascript.svg'
  when '/project-icons/python.svg' then '/skill-icons/backend-python.svg'
  when '/project-icons/react.svg' then '/project-icons/category-full-stack.svg'
  when '/project-icons/typescript.svg' then '/skill-icons/frontend-typescript.svg'
  else cover_image_href
end
where cover_image_href in (
  '/project-icons/android.svg',
  '/project-icons/category-systems.svg',
  '/project-icons/cplusplus.svg',
  '/project-icons/githubactions.svg',
  '/project-icons/java.svg',
  '/project-icons/javascript.svg',
  '/project-icons/python.svg',
  '/project-icons/react.svg',
  '/project-icons/typescript.svg'
);
