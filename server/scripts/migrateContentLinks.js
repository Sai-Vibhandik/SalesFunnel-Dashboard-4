/**
 * Migration script to fix content links for design tasks
 * This script:
 * 1. Links design tasks to their parent content tasks via parentTaskId
 * 2. Copies approved content from content tasks to design tasks
 *
 * Run with: node scripts/migrateContentLinks.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../src/models/Task');

async function migrateContentLinks() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI or MONGO_URI not found in environment');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n========== STEP 1: LINK DESIGN TASKS TO CONTENT TASKS ==========\n');

    // Find all design/video tasks without parentTaskId
    const designTasksWithoutParent = await Task.find({
      taskType: { $in: ['graphic_design', 'video_editing'] },
      $or: [
        { parentTaskId: { $exists: false } },
        { parentTaskId: null }
      ]
    });

    console.log(`Found ${designTasksWithoutParent.length} design/video tasks without parentTaskId`);

    let linkedCount = 0;
    let notFoundCount = 0;

    for (const designTask of designTasksWithoutParent) {
      console.log(`\n--- Processing ${designTask.taskType} task: ${designTask._id} ---`);
      console.log(`  Title: ${designTask.taskTitle}`);
      console.log(`  Status: ${designTask.status}`);
      console.log(`  creativeOutputType: ${designTask.creativeOutputType}`);
      console.log(`  creativeStrategyId: ${designTask.creativeStrategyId}`);
      console.log(`  projectId: ${designTask.projectId}`);

      // Determine if this is a video task based on creativeOutputType
      const videoTypes = ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video', 'reel'];
      const isVideoTask = designTask.creativeOutputType && videoTypes.includes(designTask.creativeOutputType);
      const contentTaskType = 'content_creation';
      const expectedContentType = designTask.creativeOutputType;

      // Try to find matching content task
      let contentTask = null;

      // Strategy 1: Match by creativeStrategyId and creativeOutputType
      if (designTask.creativeStrategyId && designTask.creativeOutputType) {
        contentTask = await Task.findOne({
          projectId: designTask.projectId,
          taskType: contentTaskType,
          creativeStrategyId: designTask.creativeStrategyId,
          creativeOutputType: designTask.creativeOutputType
        });
        if (contentTask) {
          console.log(`  Found content task by creativeStrategyId + creativeOutputType`);
        }
      }

      // Strategy 2: Match by creativeStrategyId and adTypeKey (legacy)
      if (!contentTask && designTask.creativeStrategyId && designTask.adTypeKey) {
        contentTask = await Task.findOne({
          projectId: designTask.projectId,
          taskType: contentTaskType,
          creativeStrategyId: designTask.creativeStrategyId,
          adTypeKey: designTask.adTypeKey
        });
        if (contentTask) {
          console.log(`  Found content task by creativeStrategyId + adTypeKey`);
        }
      }

      // Strategy 3: Match by projectId and creativeOutputType (same project, same type)
      if (!contentTask && designTask.creativeOutputType) {
        contentTask = await Task.findOne({
          projectId: designTask.projectId,
          taskType: contentTaskType,
          creativeOutputType: designTask.creativeOutputType
        });
        if (contentTask) {
          console.log(`  Found content task by projectId + creativeOutputType`);
        }
      }

      // Strategy 4: For video tasks, match by task type
      if (!contentTask && isVideoTask) {
        contentTask = await Task.findOne({
          projectId: designTask.projectId,
          taskType: contentTaskType,
          creativeOutputType: { $in: videoTypes }
        });
        if (contentTask) {
          console.log(`  Found content task by video type fallback`);
        }
      }

      if (contentTask) {
        console.log(`  Matching content task: ${contentTask._id}`);
        console.log(`    Content task title: ${contentTask.taskTitle}`);
        console.log(`    Content task status: ${contentTask.status}`);
        console.log(`    Content task creativeOutputType: ${contentTask.creativeOutputType}`);

        // Link the tasks
        designTask.parentTaskId = contentTask._id;
        await designTask.save();
        linkedCount++;
        console.log(`  ✓ Linked design task to content task`);
      } else {
        notFoundCount++;
        console.log(`  ⚠ No matching content task found`);
      }
    }

    console.log(`\n========== LINKING SUMMARY ==========`);
    console.log(`Total design tasks without parent: ${designTasksWithoutParent.length}`);
    console.log(`Successfully linked: ${linkedCount}`);
    console.log(`No matching content task found: ${notFoundCount}`);

    console.log('\n========== STEP 2: COPY APPROVED CONTENT TO DESIGN TASKS ==========\n');

    // Find all design/video tasks with parentTaskId
    const designTasksWithParent = await Task.find({
      taskType: { $in: ['graphic_design', 'video_editing'] },
      parentTaskId: { $exists: true, $ne: null }
    }).populate('parentTaskId');

    console.log(`Found ${designTasksWithParent.length} design/video tasks with parentTaskId`);

    let copiedCount = 0;
    let noContentCount = 0;
    let alreadyHasContentCount = 0;

    for (const designTask of designTasksWithParent) {
      console.log(`\n--- Processing ${designTask.taskType} task: ${designTask._id} ---`);
      console.log(`  Title: ${designTask.taskTitle}`);
      console.log(`  Status: ${designTask.status}`);

      if (!designTask.parentTaskId) {
        console.log('  ⚠ parentTaskId not populated');
        continue;
      }

      const contentTask = designTask.parentTaskId;
      console.log(`  Parent content task: ${contentTask._id}`);
      console.log(`  Content task status: ${contentTask.status}`);

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

      console.log(`  Content task has content:`);
      console.log(`    - contentLink: ${hasContentLink ? 'Yes' : 'No'}`);
      console.log(`    - contentFile: ${hasContentFile ? 'Yes' : 'No'}`);
      console.log(`    - contentNotes: ${hasContentNotes ? 'Yes' : 'No'}`);
      console.log(`    - contentOutput: ${hasContentOutput ? 'Yes' : 'No'}`);

      if (!hasContentLink && !hasContentFile && !hasContentNotes && !hasContentOutput) {
        console.log('  ⚠ Content task has NO content to copy');
        noContentCount++;
        continue;
      }

      // Check if design task already has content
      if (designTask.contentLink || designTask.contentFile?.path || designTask.contentNotes) {
        console.log('  ✓ Design task already has content - skipping');
        alreadyHasContentCount++;
        continue;
      }

      console.log('  Copying content to design task...');

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
      copiedCount++;
    }

    console.log(`\n========== COPY SUMMARY ==========`);
    console.log(`Total design tasks with parent: ${designTasksWithParent.length}`);
    console.log(`Content copied: ${copiedCount}`);
    console.log(`Already had content: ${alreadyHasContentCount}`);
    console.log(`No content to copy: ${noContentCount}`);

    console.log('\n========== MIGRATION COMPLETE ==========\n');
    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateContentLinks();