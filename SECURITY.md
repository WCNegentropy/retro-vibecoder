# Security Policy

## Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Please report security issues privately to: contact@wcnegentropy.com

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will acknowledge receipt within 48 hours and provide a timeline for the fix.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Considerations

### Template Execution

UPG templates can execute arbitrary code through:

- Post-generation hooks (Python/JS scripts)
- Command actions in manifests
- Sidecar binaries (Copier, Yeoman)

**Mitigations:**

- Review template code before generation
- Use trusted registries only
- Consider sandboxed execution (future)

### Manifest Validation

All manifests are validated against a JSON Schema before execution:

- Type checking on all fields
- Pattern validation for names and versions
- Size limits to prevent DoS

### Registry Security

When using third-party registries:

- Verify the registry source
- Review templates before use
- Keep registries updated

## Best Practices

### For Users

1. **Only use trusted templates**
   - Review manifest before generation
   - Check template source and author

2. **Review generated code**
   - Inspect generated files before running
   - Check for unexpected network calls or file access

3. **Keep UPG updated**
   - Security fixes are released in patch versions
   - Run `upg --version` to check your version

### For Template Authors

1. **Never hardcode secrets**
   - Use environment variables
   - Document required secrets clearly

2. **Minimize permissions**
   - Only request necessary file system access
   - Avoid unnecessary network calls

3. **Validate user input**
   - Use validators on prompts
   - Sanitize data before shell commands

4. **Document security implications**
   - Note any elevated permissions needed
   - Explain what hooks do

## Security Audits

We conduct periodic security reviews of:

- Core validation logic
- Sidecar execution paths
- Registry synchronization

## Acknowledgments

We thank the security researchers who responsibly disclose vulnerabilities.
