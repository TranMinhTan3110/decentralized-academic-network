import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/userService';

describe('userService.searchUsers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the user search endpoint and returns the data array', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [{ id: 'user-1', username: 'auduongtan', fullName: 'Âu Dương Tấn' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await userService.searchUsers('  tấn  ', 3);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/search?q=t%E1%BA%A5n&limit=3'),
      expect.anything()
    );
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('auduongtan');
  });

  it('skips the request when the keyword is shorter than 2 characters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await userService.searchUsers('t');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
