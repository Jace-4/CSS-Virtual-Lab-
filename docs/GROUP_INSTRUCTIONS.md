# Group Instructions

Each group implements one experiment inside its assigned folder. The integration team owns the portal shell and shared behavior.

## Your Allowed Folder

Your branch and folder use the same experiment name. For example, the MD5 group works on:

```text
Branch: group-md5
Folder: experiments/md5/
```

That folder contains:

```text
experiments/md5/
├── index.html
├── script.js
└── README.md
```

## What You May Edit

- Content inside the `theory` section
- Content inside the `procedure` section
- Experiment-specific controls and output markup inside `simulation`
- Quiz questions inside `quiz`
- Your folder's `script.js`
- Your folder's `README.md`

Keep the existing IDs, tab buttons, shared asset paths, and outer layout intact. The common tab controller expects the IDs `theory`, `procedure`, `simulation`, and `quiz`.

## What You Must Not Edit

- `index.html` at the repository root
- `css/`
- `js/common.js`
- `js/vendor/`
- `assets/`
- `.github/`
- `docs/`
- Any other group's folder
- The outer structure of your experiment page

## Content Requirements

- Theory: at least 300 accurate words
- Procedure: at least 4 clear numbered steps
- Simulation: interactive controls with visible output
- Quiz: at least 3 questions with answer handling
- README: inputs, outputs, dependencies, test cases, and known limitations

## Example Flow

1. Checkout the branch assigned to your group.
2. Work only in your experiment folder.
3. Run the portal locally with `python3 -m http.server 8000`.
4. Test your experiment in a current browser.
5. Check the browser console for errors.
6. Commit your changes to the group branch.
7. Push the branch and open a pull request to `main`.

## Pull Request Checklist

Complete the repository pull request template. Include screenshots or a short demo, test cases, and known issues. The validation workflow rejects changes outside the assigned experiment folder.
