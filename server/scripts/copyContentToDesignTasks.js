/**
 * Script to copy content from parent content tasks to design tasks
 * Run this script with: node scripts/copyContentToDesignTasks.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../src/models/Task');

async function copyContentToDesignTasks() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI or MONGO_URI not found in environment');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all design tasks that have a parentTaskId
    console.log('\n========== FINDING DESIGN TASKS WITH PARENT ==========');

    const designTasks = await Task.find({
      taskType: { $in: ['graphic_design', 'video_editing'] },
      parentTaskId: { $exists: true, $ne: null }
    }).populate('parentTaskId');

    console.log(`Found ${designTasks.length} design tasks with parentTaskId`);

    if (designTasks.length === 0) {
      console.log('\nNo design tasks with parentTaskId found.');
      console.log('Checking for tasks without parentTaskId...');

      // Check for design tasks without parentTaskId
      const designTasksWithoutParent = await Task.find({
        taskType: { $in: ['graphic_design', 'video_editing'] },
        $or: [
          { parentTaskId: { $exists: false } },
          { parentTaskId: null }
        ]
      });

      console.log(`Found ${designTasksWithoutParent.length} design tasks WITHOUT parentTaskId`);

      // Try to find matching content tasks for these
      for (const dt of designTasksWithoutParent.slice(0, 5)) {
        console.log(`\nDesign task: ${dt._id} - ${dt.taskTitle}`);
        console.log(`  taskType: ${dt.taskType}`);
        console.log(`  creativeOutputType: ${dt.creativeOutputType}`);
        console.log(`  adTypeKey: ${dt.adTypeKey}`);
        console.log(`  creativeStrategyId: ${dt.creativeStrategyId}`);

        // Find matching content task
        const contentTask = await Task.findOne({
          projectId: dt.projectId,
          taskType: 'content_creation',
          $or: [
            { creativeOutputType: dt.creativeOutputType },
            { adTypeKey: dt.adTypeKey }
          ]
        });

        if (contentTask) {
          console.log(`  Matching content task: ${contentTask._id} - ${contentTask.taskTitle}`);
          console.log(`    content status: ${contentTask.status}`);
          console.log(`    contentLink: ${contentTask.contentLink || '(none)'}`);
        } else {
          console.log(`  No matching content task found`);
        }
      }

      await mongoose.disconnect();
      console.log('\nDone!');
      process.exit(0);
    }

    let copied = 0;
    let skipped = 0;
    let noContent = 0;

    for (const designTask of designTasks) {
      console.log(`\n========== Processing ${designTask._id} ==========`);
      console.log(`Design task: ${designTask.taskTitle}`);
      console.log(`Status: ${designTask.status}`);
      console.log(`Type: ${designTask.taskType}`);

      if (!designTask.parentTaskId) {
        console.log('  ⚠ parentTaskId not populated');
        skipped++;
        continue;
      }

      const contentTask = designTask.parentTaskId;
      console.log(`Parent content task: ${contentTask._id} - ${contentTask.taskTitle}`);
      console.log(`Content task status: ${contentTask.status}`);

      // Check if content task has content
      const hasContentLink = contentTask.contentLink && contentTask.contentLink.trim() !== '';
      const hasContentFile = contentTask.contentFile && contentTask.contentFile.path;
      const hasContentNotes = contentTask.contentNotes && contentTask.contentNotes.trim() !== '';
      const hasContentOutput = contentTask.contentOutput && (
        contentTask.contentOutput.headline ||
        contentTask.contentOutput.bodyText ||
        contentTask.contentOutput.cta ||
        contentTask.contentOutput.script
      );

      console.log(`\nContent task fields:`);
      console.log(`  contentLink: ${contentTask.contentLink || '(none)'}`);
      console.log(`  contentFile: ${contentTask.contentFile ? JSON.stringify(contentTask.contentFile) : '(none)'}`);
      console.log(`  contentNotes: ${contentTask.contentNotes ? '(present)' : '(none)'}`);
      console.log(`  contentOutput: ${hasContentOutput ? '(present)' : '(none)'}`);

      if (!hasContentLink && !hasContentFile && !hasContentNotes && !hasContentOutput) {
        console.log('  ⚠ Content task has NO content to copy');
        noContent++;
        continue;
      }

      // Check if design task already has content
      if (designTask.contentLink || designTask.contentFile?.path || designTask.contentNotes) {
        console.log('  ✓ Design task already has content - skipping');
        skipped++;
        continue;
      }

      console.log('\n  Copying content to design task...');

      // Copy content fields
      if (contentTask.contentLink) {
        designTask.contentLink = contentTask.contentLink;
        console.log('  ✓ Copied contentLink');
      }
      if (contentTask.contentFile) {
        designTask.contentFile = contentTask.contentFile;
        console.log('  ✓ Copied contentFile');
      }
      if (contentTask.contentNotes) {
        designTask.contentNotes = contentTask.contentNotes;
        console.log('  ✓ Copied contentNotes');
      }
      if (contentTask.contentOutput) {
        designTask.contentOutput = contentTask.contentOutput;
        console.log('  ✓ Copied contentOutput');
      }

      await designTask.save();
      console.log('  ✓ Saved design task');
      copied++;
    }

    console.log(`\n========== SUMMARY ==========`);
    console.log(`Total design tasks with parentTaskId: ${designTasks.length}`);
    console.log(`Content copied: ${copied}`);
    console.log(`Skipped (already has content): ${skipped}`);
    console.log(`No content to copy: ${noContent}`);

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

copyContentToDesignTasks();