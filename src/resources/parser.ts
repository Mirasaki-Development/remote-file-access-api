import path from 'path';
import appConfig, { validateConfig } from './config';
import { Logger } from '../logger';
import { ResourceUtils } from './utils';

const _resources = appConfig.resources ?? [];

type ResourceType = 'file' | 'directory';
type ParsedResource = typeof _resources[number] & {
  type: ResourceType;
}

class ResourceFilters {
  constructor(
    private readonly resources: ParsedResource[],
  ) {}

  readonly bySlug = (slug: string) => {
    return this.resources.find((resource) => resource.slug === slug);
  };

  readonly byTarget = (target: string) => {
    return this.resources.find((resource) => resource.target === target);
  };
}

class ResourceValidator {
  constructor(
    private readonly resources: ParsedResource[],
  ) {}

  private readonly validate = async (resource: ParsedResource) => {
    const { slug, target, extensions } = resource;

    if (!slug || slug.length < 1) {
      throw new Error(`Resource "${target}" has an invalid slug`);
    }

    if (!target || target.length < 1) {
      throw new Error(`Resource "${slug}" has an invalid target`);
    }

    const isDirectory = await ResourceUtils.isDirectory(target);

    Logger.debug(`Resource "${slug}" data: ${target}`, {
      type: isDirectory ? 'directory' : 'file',
      slug,
      target,
      extensions,
    });

    if (isDirectory) {
      if (extensions === null || extensions.length < 1) {
        const hasFiles = await ResourceUtils.hasFiles(target, true);
        if (!hasFiles) {
          Logger.warn(`Resource "${slug}" has no files in the target directory: ${target}`);
        }
      } else {
        const hasFiles = await ResourceUtils.hasFiles(target, true, extensions);
        if (!hasFiles) {
          Logger.warn(`Resource "${slug}" has no files with the specified extensions`);
        }
      }
    } else {
      const fileName = path.basename(target);
      const fileExtension = path.extname(fileName) || null;
      const fileNameWithoutExtension = fileExtension ? path.basename(fileName, fileExtension) : fileName;
      const fileNameHasExtension = fileNameWithoutExtension !== fileName;

      Logger.debug(`Resource "${slug}" file data`, {
        fileName,
        fileNameWithoutExtension,
        fileNameHasExtension,
        fileExtension,
      });
  
      if (fileNameHasExtension && !await ResourceUtils.checkFileExists(target)) {
        Logger.warn(`Resource "${slug}" file does not exist: ${target}`);
      } else if (!fileNameHasExtension) {
        if (extensions === null || extensions.length < 1) {
          if (!await ResourceUtils.hasFiles(target, true)) {
            Logger.warn(`Resource "${slug}" has no files in the target directory: ${target}`);
          }
        } else {
          const anyExists = await Promise.all(
            extensions.map((extension) => ResourceUtils.checkFileExists(
              path.join(path.dirname(target), `${fileNameWithoutExtension}.${extension}`),
            )),
          ).then((results) => results.some((exists) => exists));
    
          if (!anyExists) {
            Logger.warn(`Resource "${slug}" has no file with the specified extensions`);
          }
        }
      }
    }
  };

  public readonly validateAll = () => {
    const uniqueSlugs = new Set<string>(
      this.resources.map((resource) => resource.slug),
    );

    if (uniqueSlugs.size !== this.resources.length) {
      throw new Error('Duplicate slugs found in resources');
    }

    for (const resource of this.resources) {
      this.validate(resource);
    }
  };
}

class ResourceParser {
  private constructor(public readonly resources: ParsedResource[]) {
    validateConfig();
    this.validator.validateAll();
  }

  private static instance: ResourceParser;
  public static async getInstance() {
    if (!ResourceParser.instance) {
      ResourceParser.instance = new ResourceParser(
        await ResourceParser.parse(_resources),
      );
    }
    return ResourceParser.instance;
  }

  private static readonly parse = async (
    resources: typeof _resources,
  ): Promise<ParsedResource[]> => {
    return Promise.all(
      resources.map(
        async (resource) => {
          const { target, ...rest } = resource;
      
          const isAbsolutePath = path.isAbsolute(target);
          if (!isAbsolutePath) {
            throw new Error(`Resource "${resource.slug}" has an invalid target path: ${target}`);
          }
      
          return {
            ...rest,
            target: path.normalize(target),
            type: await ResourceUtils.isDirectory(target) ? 'directory' : 'file',
          };
        },
      ),
    );
  };

  readonly filters = new ResourceFilters(this.resources);
  readonly validator = new ResourceValidator(this.resources);
  readonly slugs = this.resources.map((resource) => resource.slug);
  readonly targets = this.resources.map((resource) => resource.target);
}

export {
  ResourceParser,
  type ParsedResource,
};
