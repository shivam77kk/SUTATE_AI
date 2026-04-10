@echo off
echo Starting GitHub Push Process...

:: Add README
echo # SUTATE_AI >> README.md

:: Initialize Git
git init

:: Stage all files (.env and node_modules are protected by the .gitignore I already created)
git add .

:: Commit the code
git commit -m "first commit"

:: Rename branch to main
git branch -M main

:: Add your remote repository URL (ignores if it already exists)
git remote add origin https://github.com/shivam77kk/SUTATE_AI.git

:: Push to GitHub!
git push -u origin main

echo.
echo Process Complete! 
pause
